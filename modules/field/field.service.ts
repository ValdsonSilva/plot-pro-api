import { Prisma } from "../../generated/client/client";
import { prisma } from "../../infra/db/prisma";
import { auditLogService } from "../auditlog/auditLog.service";
import { fieldRepo } from "./field.repository";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

export const fieldService = {
    async create(input: {
        farm_id: string;
        code: string;
        name: string;
        area_ha: number;
        geo_boundary?: any;
        is_active?: boolean;
    }, authFarmId: string) {

        if (input.farm_id !== authFarmId) {
            const err: any = new Error("Proibido: farm_id diferente do seu escopo");
            err.statusCode = 403;
            throw err;
        }

        // garante que farm existe (melhor mensagem do que FK genérica)
        const farm = await prisma.farm.findUnique({ where: { id: input.farm_id } });
        if (!farm) throw httpError(404, "Farm não encontrada");

        try {
            return await fieldRepo.create(input);
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                // Unique constraint (farm_id, code)
                if (e.code === "P2002") throw httpError(409, "Já existe um talhão com esse código nessa fazenda");
                if (e.code === "P2003") throw httpError(400, "farm_id inválido");
            }
            throw e;
        }
    },

    async list(args: { farmId?: string; isActive?: boolean; q?: string; skip?: number; take?: number }, authFarmId: string) {
        if (!authFarmId) return httpError(400, "farmId é obrigatório");
        return fieldRepo.list({ ...args, farmId: authFarmId });
    },

    async get(id: string) {
        const field = await fieldRepo.findById(id);
        if (!field) throw httpError(404, "Talhão não encontrado");
        return field;
    },

    async update(id: string, patch: {
        code?: string;
        name?: string;
        area_ha?: number;
        geo_boundary?: any;
        is_active?: boolean;
    }) {
        // garante que existe
        await this.get(id);

        try {
            return await fieldRepo.update(id, {
                ...(patch.code !== undefined ? { code: patch.code } : {}),
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.area_ha !== undefined ? { area_ha: patch.area_ha as any } : {}),
                ...(patch.geo_boundary !== undefined ? { geo_boundary: patch.geo_boundary } : {}),
                ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
            });
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === "P2002") throw httpError(409, "Já existe um talhão com esse código nessa fazenda");
            }
            throw e;
        }
    },

    async deactivate(id: string, actorUserId: string) {
        const before = await this.get(id);

        const updated = await fieldRepo.update(id, { is_active: false });

        await auditLogService.log({
            entity_type: "field",
            entity_id: id,
            action: "UPDATE",
            changed_by_user_id: actorUserId,
            before_json: before,
            after_json: updated,
        });

        return updated;
    },

};
