import type { Request } from "express";

export function getActorUserId(req: Request): string {
    if (req.auth?.userId) {
        return req.auth.userId;
    } else {
        return "";
    }
}

export function getActorFarmId(req: Request): string {
    if (req.auth?.farmId) return req.auth.farmId;

    const err: any = new Error("Sem autenticação (faça login e envie Authorization: Bearer ...)");
    err.statusCode = 401;
    throw err;
}
