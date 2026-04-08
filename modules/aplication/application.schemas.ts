import { z } from "zod";
import { EventType } from "../../generated/client/enums";

const EVENT_STATUS = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"] as const;

// modelo de schema para itens de aplicação
const itemSchema = z.object({
    product_id: z.string(),
    dose_per_ha: z.coerce.number().positive(),
    dose_unit: z.string().min(1),
    total_planned: z.coerce.number().positive(),
    total_unit: z.string().min(1),

    total_actual: z.coerce.number().positive().optional(),
    total_actual_unit: z.string().min(1).optional(),
    spray_solution_l: z.coerce.number().positive().optional(),
    packaging_count: z.coerce.number().int().positive().optional(),
    packaging_type: z.string().min(1).optional(),
});

export const createApplicationSchema = z.object({
    body: z
        .object({
            // FieldEvent base
            field_id: z.string(),
            event_type: z.enum(EventType),
            status: z.enum(EVENT_STATUS).optional(),
            start_at: z.coerce.date(),
            end_at: z.coerce.date(),
            responsible_user_id: z.string(),
            notes: z.string().optional(),
            source_document_id: z.string().optional(),

            // Application (especialização)
            application_name: z.string().min(2),
            work_rate_value: z.coerce.number().positive(),
            work_rate_unit: z.string().min(1),

            spray_volume_total_l: z.coerce.number().positive().optional(),
            spray_volume_l_per_ha: z.coerce.number().positive().optional(),
            tank_count_planned: z.coerce.number().int().min(0).optional(),
            tank_count_actual: z.coerce.number().int().min(0).optional(),
            preferred_period: z.string().min(1),
            wind_min_kmh: z.coerce.number().int().min(0),
            wind_max_kmh: z.coerce.number().int().min(0),

            items: z.array(itemSchema).min(1), // lista (array) de items utilizados na aplicação (produtos e quantidades destes)
        })
        .refine((b) => b.start_at <= b.end_at, { message: "start_at deve ser <= end_at" })
        .refine((b) => b.wind_min_kmh <= b.wind_max_kmh, { message: "wind_min_kmh deve ser <= wind_max_kmh" }),
});

export const getApplicationSchema = z.object({
    params: z.object({
        eventId: z.string(),
    }),
});

export const listApplicationsSchema = z.object({
    query: z.object({
        fieldId: z.string(),
        farmId: z.string(),
        status: z.enum(EVENT_STATUS).optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        includeItems: z
            .string()
            .optional()
            .transform((v) => (v === undefined ? undefined : v === "true")),
        skip: z.coerce.number().int().min(0).optional(),
        take: z.coerce.number().int().min(1).max(100).optional(),
    }),
});

export const updateApplicationSchema = z.object({
    params: z.object({
        eventId: z.string(),
    }),
    body: z
        .object({
            // patch FieldEvent
            event_type: z.enum(EventType).optional(),
            status: z.enum(EVENT_STATUS).optional(),
            start_at: z.coerce.date().optional(),
            end_at: z.coerce.date().optional(),
            responsible_user_id: z.string().optional(),
            notes: z.string().nullable().optional(),
            source_document_id: z.string().nullable().optional(),

            // patch Application
            application_name: z.string().min(2).optional(),
            work_rate_value: z.coerce.number().positive().optional(),
            work_rate_unit: z.string().min(1).optional(),
            spray_volume_total_l: z.coerce.number().positive().nullable().optional(),
            spray_volume_l_per_ha: z.coerce.number().positive().nullable().optional(),
            tank_count_planned: z.coerce.number().int().min(0).nullable().optional(),
            tank_count_actual: z.coerce.number().int().min(0).nullable().optional(),
            preferred_period: z.string().min(1).optional(),
            wind_min_kmh: z.coerce.number().int().min(0).optional(),
            wind_max_kmh: z.coerce.number().int().min(0).optional(),

            // se enviar items, substitui todos
            items: z.array(itemSchema).min(1).optional(),
        })
        .refine((b) => Object.keys(b).length > 0, { message: "Envie ao menos um campo para atualizar" })
        .refine(
            (b) => (b.wind_min_kmh === undefined || b.wind_max_kmh === undefined) || b.wind_min_kmh <= b.wind_max_kmh,
            { message: "wind_min_kmh deve ser <= wind_max_kmh" }
        ),
});

export const cancelApplicationSchema = z.object({
    params: z.object({ eventId: z.string() }),
});
