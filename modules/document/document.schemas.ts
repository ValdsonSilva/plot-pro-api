import { z } from "zod";

export const listDocumentsSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).optional(),
        skip: z.coerce.number().int().min(0).optional(),
        take: z.coerce.number().int().min(1).max(200).optional(),
    }),
});

export const getDocumentSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
});

export const deleteDocumentSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
});
