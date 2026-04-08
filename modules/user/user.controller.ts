import type { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";

export const userController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            console.log("body:", req.body);
            const actorUserId = req.auth?.userId ?? "";
            const farmId = req.body?.farmId ?? "";
            // if (actorUserId === "") return res.status(400).json({ message: "actorUserId é obrigatório" });
            if (farmId === "") return res.status(400).json({ message: "farmId é obrigatório" });
            const { body } = req;
            res.status(201).json(await userService.create(body, actorUserId));
        } catch (e: any) {
            return res.status(500).json({ messsage: "Erro ao criar usuário", error: e.message })
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = (req as any).validated;
            res.json(await userService.list(query));
        } catch (e) {
            next(e);
        }
    },

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { params } = (req as any).validated;
            res.json(await userService.get(params.id));
        } catch (e) {
            next(e);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const actorUserId = req.body.actorUserId;
            if (!actorUserId) return res.status(400).json({ message: "actorUserId é obrigatório" });
            const { params, body } = (req as any).validated;
            res.json(await userService.update(params.id, body, actorUserId));
        } catch (e) {
            next(e);
        }
    },

    async deactivate(req: Request, res: Response, next: NextFunction) {
        try {
            const actorUserId = req.body.actorUserId;
            if (!actorUserId) return res.status(400).json({ message: "actorUserId é obrigatório" });
            const { params } = (req as any).validated;
            res.json(await userService.deactivate(params.id, actorUserId));
        } catch (e) {
            next(e);
        }
    },
}