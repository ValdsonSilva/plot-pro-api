import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    const status = err.statusCode ?? 500;
    const message = err.message ?? "Erro interno";
    res.status(status).json({ message });
}
