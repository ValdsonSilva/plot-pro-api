import { z } from "zod";

export const listUsersSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).optional(),
        role: z.string().trim().min(1).optional(),
        isActive: z
            .string()
            .optional()
            .transform((v) => (v === undefined ? undefined : v === "true")),
        skip: z.coerce.number().int().min(0).optional(),
        take: z.coerce.number().int().min(1).max(200).optional(),
    }),
});

export const getUserSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
});

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(120),
        email: z.string().optional(),
        password: z.string().min(8),
        role: z.string().trim().min(1).max(80).optional(),
        is_active: z.boolean().optional(),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
    body: z
        .object({
            name: z.string().trim().min(2).max(120).optional(),
            email: z.string().optional(),
            role: z.string().trim().min(1).max(80).nullable().optional(),
            is_active: z.boolean().optional(),
        })
        .refine((b) => Object.keys(b).length > 0, {
            message: "Envie ao menos um campo para atualizar",
        }),
});

export const deactivateUserSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
});
