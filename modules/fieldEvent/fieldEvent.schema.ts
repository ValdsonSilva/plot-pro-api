import { z } from "zod";
import { EventType } from "../../generated/client/enums";
import { forbiddenTypes } from "../../utils/forbiddenTypes";

// aplicação, plantio, colheita, preparo de solo, outros
const EVENT_TYPES = ["SOIL_PLOWING", "SOIL_HARROWING", "SOIL_SUBSOILING", "LIMING", "GYPSUM_APPLICATION", "PLANTING", "FERTILIZATION", "PESTICIDE_APPLICATION", "IRRIGATION", "HARVEST", "MONITORING"] as const;
const EVENT_STATUS = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"] as const;
const EXECUTION_METHODS = ["DISTRIBUTING", "INCORPORATION"] as const;
const SEED_QUANTITY_UNITS = ["SEED_M", "KG_HA"] as const;

function validatePlantingFields(data: any, ctx: z.RefinementCtx) {
    if (data.event_type !== "PLANTING") return;

    if (!data.execution_method) {
        ctx.addIssue({
            code: "custom",
            message: "Método de execução é obrigatório para evento de plantio",
            path: ["execution_method"],
        });
    }

    if (!data.crop || data.crop.trim().length === 0) {
        ctx.addIssue({
            code: "custom",
            message: "Cultura é obrigatória para evento de plantio",
            path: ["crop"],
        });
    }

    if (!data.variety || data.variety.trim().length === 0) {
        ctx.addIssue({
            code: "custom",
            message: "Variedade é obrigatória para evento de plantio",
            path: ["variety"],
        });
    }

    if (data.seed_quantity === undefined) {
        ctx.addIssue({
            code: "custom",
            message: "Quantidade de sementes é obrigatória para evento de plantio",
            path: ["seed_quantity"],
        });
    }

    if (!data.seed_quantity_unit) {
        ctx.addIssue({
            code: "custom",
            message: "Unidade da quantidade de sementes é obrigatória para evento de plantio",
            path: ["seed_quantity_unit"],
        });
    }

    if (data.rainfall_mm === undefined) {
        ctx.addIssue({
            code: "custom",
            message: "Pluviometria do dia é obrigatória para evento de plantio",
            path: ["rainfall_mm"],
        });
    }
}

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

            // Campos obrigatórios somente quando event_type = PLANTING
            execution_method: z.enum(EXECUTION_METHODS).optional(),
            crop: z.string().trim().min(1).optional(),
            variety: z.string().trim().min(1).optional(),
            seed_quantity: z.coerce.number().positive().optional(),
            seed_quantity_unit: z.enum(SEED_QUANTITY_UNITS).optional(),
            rainfall_mm: z.coerce.number().min(0).optional(),
        })
        .refine((b) => b.start_at <= b.end_at, {
            message: "start_at deve ser <= end_at",
        })
        .refine(
            (b) => {
                return !forbiddenTypes.includes(b.event_type as any);
            },
            {
                message: "Para eventos de aplicação de produto use o endpoint /applications",
            }
        )
        .superRefine(validatePlantingFields),
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

            // Campos específicos para evento de plantio
            execution_method: z.enum(EXECUTION_METHODS).nullable().optional(),
            crop: z.string().trim().min(1).nullable().optional(),
            variety: z.string().trim().min(1).nullable().optional(),
            seed_quantity: z.coerce.number().positive().nullable().optional(),
            seed_quantity_unit: z.enum(SEED_QUANTITY_UNITS).nullable().optional(),
            rainfall_mm: z.coerce.number().min(0).nullable().optional(),
        })
        .refine((b) => Object.keys(b).length > 0, {
            message: "Envie ao menos um campo para atualizar",
        }),
});

export const cancelFieldEventSchema = z.object({
    params: z.object({ id: z.string() }),
});