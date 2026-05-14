import { z } from "zod";

export const createFarmSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    location: z.string().optional(),
    is_active: z.boolean().optional(),
    farm_map_document_id: z.string().optional(),
  }),
});

export const updateFarmSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      location: z.string().trim().min(1).max(200).nullable().optional(),
      is_active: z.boolean().optional(),
      farm_map_document_id: z.string().nullable().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, {
      message: "Envie ao menos um campo para atualizar",
    }),
});

export const deactivateFarmSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const uploadFarmMapSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const removeFarmMapSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});