import type { Request, Response, NextFunction } from "express";
import { fieldService } from "./field.service";

export const fieldController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { body } = (req as any).validated;
            const farmId = req.auth!.farmId;
            const created = await fieldService.create(body, farmId);
            res.status(201).json(created);
        } catch (e) {
            next(e);
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = (req as any).validated;
            const farmId = req.auth!.farmId;

            const rows = await fieldService.list({
                farmId: query.farmId,
                isActive: query.isActive,
                q: query.q,
                skip: query.skip,
                take: query.take,
            }, farmId);

            res.json(rows);
        } catch (e) {
            next(e);
        }
    },

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { params } = (req as any).validated;
            const row = await fieldService.get(params.id);
            res.json(row);
        } catch (e) {
            next(e);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { params, body } = (req as any).validated;
            const updated = await fieldService.update(params.id, body);
            res.json(updated);
        } catch (e) {
            next(e);
        }
    },

    async deactivate(req: any, res: any, next: any) {
        try {
            const actor = req.user.userActorId;
            if (!actor) return res.status(403).json({ message: "userActorId é obrigatório" });
            const { params } = req.validated;
            res.json(await fieldService.deactivate(params.id, actor));
        } catch (e) {
            next(e);
        }
    },
};
