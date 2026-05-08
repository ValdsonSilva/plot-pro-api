import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { AnyZodObject } from "zod/v3";

// export const validate =
//     (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
//         const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
//         if (!result.success) {
//             const err: any = new Error("Validation error");
//             err.statusCode = 400;
//             err.details = result.error.flatten();
//             return next(err);
//         }
//         (req as any).validated = result.data;
//         next();
//     };

export const validate = (schema: AnyZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            (req as any).validated = validated;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // ADICIONE ESTE LOG AQUI PARA VER O QUE ESTÁ QUEBRANDO
                console.log("ERRO DE VALIDAÇÃO ZOD:", JSON.stringify(error, null, 2));

                return res.status(400).json(error.format());
            }
            next(error);
        }
    };