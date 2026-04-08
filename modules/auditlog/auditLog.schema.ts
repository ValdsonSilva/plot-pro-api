import { z } from "zod";

export const listAuditLogsSchema = z.object({
  query: z.object({
    entityType: z.string().min(1).optional(),
    entityId: z.coerce.number().int().positive().optional(),
    changedByUserId: z.coerce.number().int().positive().optional(),
    action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(200).optional(),
  }),
});
