import type { Request, Response, NextFunction } from "express";
import { getActorFarmId, getActorUserId } from "../../infra/http/actor";
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

            if (!id) {
                return res.status(400).json({ message: "ID é obrigatório" });
            }

            res.json(await farmService.get(id));
        } catch (e) {
            next(e);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const actor = getActorUserId(req);

            if (!actor) {
                return res.status(401).json({ message: "Usuário autenticado não encontrado" });
            }

            const { params, body } = (req as any).validated;

            res.json(await farmService.update(params.id, body, actor));
        } catch (e) {
            next(e);
        }
    },

    async uploadMap(req: Request, res: Response, next: NextFunction) {
        try {
            const actor = getActorUserId(req);
            const authFarmId = getActorFarmId(req);
            const { params } = (req as any).validated;

            if (!actor) {
                return res.status(401).json({ message: "Usuário autenticado não encontrado" });
            }

            const farm = await farmService.uploadMap(
                params.id,
                (req as any).file,
                actor,
                authFarmId
            );

            res.status(201).json(farm);
        } catch (e) {
            next(e);
        }
    },

    async removeMap(req: Request, res: Response, next: NextFunction) {
        try {
            const actor = getActorUserId(req);
            const authFarmId = getActorFarmId(req);
            const { params } = (req as any).validated;

            if (!actor) {
                return res.status(401).json({ message: "Usuário autenticado não encontrado" });
            }

            res.json(await farmService.removeMap(params.id, actor, authFarmId));
        } catch (e) {
            next(e);
        }
    },

    async deactivate(req: Request, res: Response, next: NextFunction) {
        try {
            const actor = getActorUserId(req);

            if (!actor) {
                return res.status(401).json({ message: "Usuário autenticado não encontrado" });
            }

            const { params } = (req as any).validated;

            res.json(await farmService.deactivate(params.id, actor));
        } catch (e) {
            next(e);
        }
    },
};