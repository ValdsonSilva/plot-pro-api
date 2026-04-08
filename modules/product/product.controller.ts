import type { Request, Response, NextFunction } from "express";
import { productService } from "./product.service";

export const productController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const actor = req.auth?.userId
            if (!actor) return res.status(400).json({ message: "userId é obrigatório" });
            const { body } = (req as any).validated;
            const created = await productService.create(body, actor);
            res.status(201).json(created);
        } catch (e) {
            next(e);
        }
    },

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = (req as any).validated;
            res.json(await productService.list(query));
        } catch (e) {
            next(e);
        }
    },

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { params } = (req as any).validated;
            res.json(await productService.get(params.id));
        } catch (e) {
            next(e);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const actor = req.auth?.userId;
            if (!actor) return res.status(400).json({ message: "userId é obrigatório" });
            const { params, body } = (req as any).validated;
            res.json(await productService.update(params.id, body, actor));
        } catch (e) {
            next(e);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const actor = req.auth?.userId;
            if (!actor) return res.status(400).json({ message: "userId é obrigatório" })
            const { params } = (req as any).validated;
            res.json(await productService.delete(params.id, actor));
        } catch (e) {
            next(e);
        }
    },
};
