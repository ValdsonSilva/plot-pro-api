import type { Request, Response, NextFunction } from "express";
import { auditLogService } from "./auditLog.service";

export const auditLogController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = (req as any).validated;
            const rows = await auditLogService.list(query);
            res.json(rows);
        } catch (e) {
            next(e);
        }
    },
};
