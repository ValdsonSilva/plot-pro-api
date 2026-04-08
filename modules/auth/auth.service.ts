import argon2 from "argon2";
import { prisma } from "../../infra/db/prisma";
import { signAccessToken } from "../../infra/http/auth";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
};

export const authService = {
    async login(input: { email: string; password: string }) {
        const user = await prisma.user.findUnique({
            where: { email: input.email },
            include: { farms: true },
        });

        if (!user) throw httpError(401, "Credenciais inválidas");
        if (!user.is_active) throw httpError(403, "Usuário desativado");
        if (!user.farms.is_active) throw httpError(403, "Fazenda desativada");

        const ok = await argon2.verify(user.password_hash, input.password);
        if (!ok) throw httpError(401, "Credenciais inválidas");

        const token = signAccessToken({ userId: user.id, farmId: user.farm_id, role: user.role ?? null });

        return {
            access_token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, farm_id: user.farm_id },
            farm: { id: user.farms.id, name: user.farms.name },
        };
    },

    async me(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { farms: true },
        });
        if (!user) throw httpError(401, "Sessão inválida");

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, farm_id: user.farm_id },
            farm: { id: user.farms.id, name: user.farms.name },
        };
    },
};
