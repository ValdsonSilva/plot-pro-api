import { z } from "zod";
import { ProductCategory } from "../../generated/client/enums";

export const listProductsSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).optional(),
        category: z.enum(ProductCategory).optional(),
        skip: z.coerce.number().int().min(0).optional(),
        take: z.coerce.number().int().min(1).max(200).optional(),
    }),
});

export const getProductSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
});

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(120),
        category: z.enum(ProductCategory),
        default_unit: z.string().trim().min(1).max(20),
        manufacturer: z.string().trim().min(1).max(120).optional(),
        notes: z.string().trim().min(1).max(1000).optional(),
    }),
});

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
    body: z
        .object({
            name: z.string().trim().min(2).max(120).optional(),
            category: z.enum(ProductCategory).optional(),
            default_unit: z.string().trim().min(1).max(20).optional(),
            manufacturer: z.string().trim().min(1).max(120).nullable().optional(),
            notes: z.string().trim().min(1).max(1000).nullable().optional(),
        })
        .refine((b) => Object.keys(b).length > 0, { message: "Envie ao menos um campo para atualizar" }),
});

export const deleteProductSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
});
