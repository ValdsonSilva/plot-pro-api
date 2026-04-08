import type { Request, Response, NextFunction } from "express";
import { applicationService } from "./application.service";

export const applicationController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { body } = (req as any).validated;
            const farmId = req.auth!.farmId;
            const created = await applicationService.create(body, farmId);
            res.status(201).json(created);
        } catch (e: any) {
            return res.status(500).json({ message: "Erro ao criar aplicação no talhão", error: e.message })
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = (req as any).validated;
            const farmId = req.auth!.farmId;
            const rows = await applicationService.list(query, farmId);
            res.json(rows);
        } catch (e) {
            next(e);
        }
    },

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { params } = (req as any).validated;
            const row = await applicationService.get(params.eventId);
            res.json(row);
        } catch (e) {
            next(e);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { params, body } = (req as any).validated;
            const updated = await applicationService.update(params.eventId, body);
            res.json(updated);
        } catch (e) {
            next(e);
        }
    },

    async cancel(req: any, res: any, next: any) {
        try {
            const actor = req.body.actorUserId;
            if (!actor) return res.status(400).json({ message: "actorUserId é obrigatório" });
            const { params } = req.validated;
            res.json(await applicationService.cancel(params.eventId, actor));
        } catch (e) {
            next(e);
        }
    },
};
