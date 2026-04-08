import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        email: z.string(),
        password: z.string().min(8),
    }),
});
