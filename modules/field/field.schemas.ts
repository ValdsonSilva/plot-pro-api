import { z } from "zod";

export const listFieldsSchema = z.object({
    query: z.object({
        farmId: z.string().optional(),
        isActive: z
            .string()
            .optional()
            .transform((v) => (v === undefined ? undefined : v === "true")),
        q: z.string().trim().min(1).optional(),
        skip: z.coerce.number().int().min(0).optional(),
        take: z.coerce.number().int().min(1).max(100).optional(),
    }),
});

export const getFieldSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
});

export const createFieldSchema = z.object({
    body: z.object({
        farm_id: z.string(),
        code: z.string().trim().min(1).max(50),
        name: z.string().trim().min(2).max(120),
        area_ha: z.coerce.number().positive(), // Prisma Decimal ok
        geo_boundary: z.any().optional(), // Json (GeoJSON etc)
        is_active: z.boolean().optional(),
    }),
});

export const updateFieldSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
    body: z
        .object({
            code: z.string().trim().min(1).max(50).optional(),
            name: z.string().trim().min(2).max(120).optional(),
            area_ha: z.coerce.number().positive().optional(),
            geo_boundary: z.any().nullable().optional(),
            is_active: z.boolean().optional(),
        })
        .refine((b) => Object.keys(b).length > 0, {
            message: "Envie ao menos um campo para atualizar",
        }),
});

export const deactivateFieldSchema = z.object({
    params: z.object({ id: z.string() }),
});
