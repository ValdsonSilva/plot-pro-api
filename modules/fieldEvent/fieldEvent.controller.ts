import type { Request, Response, NextFunction } from "express";
import { fieldEventService } from "./fieldEvent.service";
import { FieldEvent } from "../../generated/client/client";

export const fieldEventController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { body } = (req as any).validated;
            const farmId = req.auth!.farmId;
            const created = await fieldEventService.create(body, farmId);
            res.status(201).json(created);
        } catch (e) {
            next(e);
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = (req as any).validated;
            const farmId = req.auth!.farmId;
            const rows = await fieldEventService.list(query, farmId);

            // const reverse_rows = rows.reverse();

            res.json(rows);
        } catch (e) {
            next(e);
        }
    },

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { params } = (req as any).validated;
            const row = await fieldEventService.get(params.id);
            res.json(row);
        } catch (e) {
            next(e);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { params, body } = (req as any).validated;
            const updated = await fieldEventService.update(params.id, body);
            res.json(updated);
        } catch (e) {
            next(e);
        }
    },

    async cancel(req: any, res: any, next: any) {
        try {
            const actor = req.body.actorUserId;
            if (!actor) return res.status(400).json({ message: "actorUserId é obrigatóro" });
            const { params } = req.validated;
            res.json(await fieldEventService.cancel(params.id, actor));
        } catch (e) {
            next(e);
        }
    },
};
