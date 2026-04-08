import { z } from "zod";
import { EventType } from "../../generated/client/enums";
import { forbiddenTypes } from "../../utils/forbiddenTypes";

// aplicação, plantio, colheita, preparo de solo, outros
const EVENT_TYPES = ["SOIL_PLOWING", "SOIL_HARROWING", "SOIL_SUBSOILING", "LIMING", "GYPSUM_APPLICATION", "PLANTING", "FERTILIZATION", "PESTICIDE_APPLICATION", "IRRIGATION", "HARVEST", "MONITORING"] as const; // adicionar demais tipos de eventos de talhão
const EVENT_STATUS = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"] as const;

export const listFieldEventsSchema = z.object({
    query: z.object({
        fieldId: z.coerce.string().optional(),
        farmId: z.coerce.string().optional(),
        eventType: z.enum(EventType).optional(),
        status: z.enum(EVENT_STATUS).optional(),
        responsibleUserId: z.coerce.string().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        includeApplication: z
            .string()
            .optional()
            .transform((v) => (v === undefined ? undefined : v === "true")),
        skip: z.coerce.number().int().min(0).optional(),
        take: z.coerce.number().int().min(1).max(100).optional(),
    }),
});

export const getFieldEventSchema = z.object({
    params: z.object({
        id: z.coerce.string(),
    }),
});

export const createFieldEventSchema = z.object({
    body: z
        .object({
            field_id: z.string(),
            event_type: z.enum(EVENT_TYPES),
            status: z.enum(EVENT_STATUS).optional(),
            start_at: z.coerce.date(),
            end_at: z.coerce.date(),
            responsible_user_id: z.string(),
            notes: z.string().optional(),
            source_document_id: z.string().optional(),
        })
        .refine((b) => b.start_at <= b.end_at, {
            message: "start_at deve ser <= end_at",
        })
        .refine(
            (b) => {
                // Retorna true (passa) APENAS se o tipo NÃO estiver na lista proibida
                return !forbiddenTypes.includes(b.event_type as any);
            },
            {
                message: "Para eventos de aplicação de produto use o endpoint /applications",
            }
        ),
});

export const updateFieldEventSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
    body: z
        .object({
            event_type: z.enum(EventType).optional(),
            status: z.enum(EVENT_STATUS).optional(),
            start_at: z.coerce.date().optional(),
            end_at: z.coerce.date().optional(),
            responsible_user_id: z.string().optional(),
            notes: z.string().nullable().optional(),
            source_document_id: z.string().nullable().optional(),
        })
        .refine((b) => Object.keys(b).length > 0, {
            message: "Envie ao menos um campo para atualizar",
        }),
});

export const cancelFieldEventSchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
});
