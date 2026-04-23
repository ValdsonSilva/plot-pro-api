import { z } from "zod";
import { EventType } from "../../generated/client/enums";

const EVENT_STATUS = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"] as const;
const ExecutionMethod = ["DISTRIBUTING", "INCORPORATION"] as const;
const ApplicationMedium = ["DRONE", "AIRCRAFT", "TERRESTRIAL"] as const;
const ProductState = ["LIQUID", "SOLID"] as const;

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

            // Application (campos gerais)
            application_name: z.string().min(2),
            work_rate_value: z.coerce.number().positive(),
            work_rate_unit: z.string().min(1),
            preferred_period: z.string().min(1, "Horário de início é obrigatório")
                .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
                    message: "Formato inválido. Use HH:mm (ex: 08:30)",
                }),
            wind_min_kmh: z.coerce.number().int().min(0),
            wind_max_kmh: z.coerce.number().int().min(0),

            // Novos campos de controle
            product_state: z.enum(ProductState),
            application_medium: z.enum(ApplicationMedium).default("TERRESTRIAL"),
            execution_method: z.enum(ExecutionMethod).optional(), // Opcional, usado mais em sólidos

            // Campos de Pulverização (Opcionais no schema base, validados no refine)
            temp_min_c: z.coerce.number().optional(),
            temp_max_c: z.coerce.number().optional(),
            humidity_min: z.coerce.number().min(0).max(100).optional(),

            spray_volume_total_l: z.coerce.number().min(0, "Informe este campo (valor positivo)").optional(),
            spray_volume_l_per_ha: z.coerce.number().min(0, "Informe este campo (valor positivo)").optional(),

            tank_count_planned: z.coerce.number().int().min(0).optional(),
            tank_count_actual: z.coerce.number().int().min(0).optional(),

            items: z.array(itemSchema).min(1),
        })
        .refine((b) => b.start_at <= b.end_at, { message: "start_at deve ser <= end_at" })
        .refine((b) => b.wind_min_kmh <= b.wind_max_kmh, { message: "Vento min deve ser <= Vento max" })
        // Validação Condicional: Se for LÍQUIDO, exige clima
        .superRefine((data, ctx) => {
            if (data.product_state === "LIQUID") {
                if (data.temp_min_c === undefined) {
                    ctx.addIssue({ code: "custom", message: "Temp. mínima é obrigatória para líquidos", path: ["temp_min_c"] });
                }
                if (data.humidity_min === undefined) {
                    ctx.addIssue({ code: "custom", message: "Umidade mínima é obrigatória para líquidos", path: ["humidity_min"] });
                }
            }

            // Se for Calagem/Gessagem, pode exigir o execution_method
            if (["LIMING", "GYPSUM_APPLICATION"].includes(data.event_type) && !data.execution_method) {
                ctx.addIssue({ code: "custom", message: "Método de execução é obrigatório para este evento", path: ["execution_method"] });
            }
        }),
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
            // FieldEvent patch
            event_type: z.enum(EventType).optional(),
            status: z.enum(EVENT_STATUS).optional(),
            start_at: z.coerce.date().optional(),
            end_at: z.coerce.date().optional(),
            responsible_user_id: z.string().optional(),
            notes: z.string().nullable().optional(),
            source_document_id: z.string().nullable().optional(),

            // Application patch
            application_name: z.string().min(2).optional(),
            work_rate_value: z.coerce.number().positive().optional(),
            work_rate_unit: z.string().min(1).optional(),
            preferred_period: z.string().min(1, "Horário de início é obrigatório")
                .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
                    message: "Formato inválido. Use HH:mm (ex: 08:30)",
                }).optional(),
            wind_min_kmh: z.coerce.number().int().min(0).optional(),
            wind_max_kmh: z.coerce.number().int().min(0).optional(),

            product_state: z.enum(ProductState).optional(),
            application_medium: z.enum(ApplicationMedium).optional(),
            execution_method: z.enum(ExecutionMethod).optional(),

            temp_min_c: z.coerce.number().optional(),
            temp_max_c: z.coerce.number().optional(),
            humidity_min: z.coerce.number().optional(),

            spray_volume_total_l: z.coerce.number().min(0, "Informe este campo (valor positivo)").optional(),
            spray_volume_l_per_ha: z.coerce.number().min(0, "Informe este campo (valor positivo)").optional(),
            tank_count_planned: z.coerce.number().int().min(0).nullable().optional(),
            tank_count_actual: z.coerce.number().int().min(0).nullable().optional(),

            items: z.array(itemSchema).min(1).optional(),
        })
        .refine((b) => Object.keys(b).length > 0, { message: "Envie ao menos um campo" })
        .refine(
            (b) => !(b.wind_min_kmh && b.wind_max_kmh) || b.wind_min_kmh <= b.wind_max_kmh,
            { message: "Vento min deve ser <= Vento max" }
        ),
});

export const cancelApplicationSchema = z.object({
    params: z.object({ eventId: z.string() }),
});
