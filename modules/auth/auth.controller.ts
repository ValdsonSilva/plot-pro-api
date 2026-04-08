import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

export const authController = {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { body } = (req as any).validated;
            res.json(await authService.login(body));
        } catch (e) {
            next(e);
        }
    },

    async me(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.auth!.userId;
            res.json(await authService.me(userId));
        } catch (e) {
            next(e);
        }
    },
};
