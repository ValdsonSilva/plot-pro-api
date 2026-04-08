import type { Request, Response, NextFunction } from "express";
import { farmService } from "./farm.service";

export const farmController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { body } = (req as any).validated;
            const farm = await farmService.create(body);
            res.status(201).json(farm);
        } catch (e) {
            next(e);
        }
    },

    async list(_req: Request, res: Response, next: NextFunction) {
        try {
            res.json(await farmService.list());
        } catch (e) {
            next(e);
        }
    },

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;

            if (!id) res.status(400).json({ message: "ID é obrigatório" })

            res.json(await farmService.get(id));
        } catch (e) {
            next(e);
        }
    },

    async update(req: any, res: any, next: any) {
        try {
            const actor = req.body.actorUserId;
            if (!actor) return res.status(400).json({ message: "actorUserId é obrigatório" });
            const { params, body } = req.validated;
            res.json(await farmService.update(params.id, body, actor));
        } catch (e) {
            next(e);
        }
    },

    async deactivate(req: any, res: any, next: any) {
        try {
            const actor = req.body.actorUserId;
            if (!actor) return res.status(400).json({ message: "actorUserId é obrigatório" });
            const { params } = req.validated;
            res.json(await farmService.deactivate(params.id, actor));
        } catch (e) {
            next(e);
        }
    },
};
