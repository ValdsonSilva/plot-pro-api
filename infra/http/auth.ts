import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
    sub: string,
    farm_id: string,
    role?: string | null,
};

const secret = process.env.JWT_SECRET!;
const expiresIn = process.env.JWT_EXPIRES_IN ?? "168h";

export function signAccessToken(payload: { userId: string, farmId: string, role?: string | null }) {
    return jwt.sign(
        {
            farm_id: payload.farmId,
            role: payload.role ?? null
        },
        secret,
        {
            subject: payload.userId,
            expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
            // algorithm: "HS256"
        }
    );
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
    try {
        const header = req.header("authorization");
        if (!header?.startsWith("Bearer ")) {
            const err: any = new Error("Token ausente (Authorization: Bearer ...)");
            err.statusCode = 401;
            throw err;
        }

        const token = header.slice("Bearer ".length);
        const decoded = jwt.verify(token, secret) as JwtPayload;

        const userId = decoded.sub;
        const farmId = decoded.farm_id;

        if (userId.split("").length === 0 || farmId.split("").length === 0) {
            const err: any = new Error("Token inválido");
            err.statusCode = 401;
            throw err;
        }

        req.auth = { userId, farmId, role: decoded.role ?? null };
        next();
    } catch (e: any) {
        if (!e.statusCode) e.statusCode = 401;
        next(e);
    }
}
