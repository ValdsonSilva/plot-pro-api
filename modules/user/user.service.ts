import { prisma } from "../../infra/db/prisma";
import { userRepo } from "./user.repository";
import { auditLogService } from "../auditlog/auditLog.service";
import argon2 from "argon2";
import { farmService } from "../farm/farm.service";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

export const userService = {
    async create(input: any, actorUserId?: string) {

        const farm = await prisma.farm.findUnique({ where: { id: input.farmId } });
        console.log("farm:", farm);
        if (!farm) throw httpError(404, "Fazenda não encontrada");

        const password_hash = await argon2.hash(input.password);
        if (actorUserId === "") actorUserId = undefined;

        const created = await userRepo.create({
            farm_id: input.farmId,
            name: input.name,
            email: input.email,
            password_hash,
            role: input.role,
            is_active: input.is_active ?? true,
        });

        // await auditLogService.log({
        //     entity_type: "user",
        //     entity_id: created.id,
        //     action: "CREATE",
        //     changed_by_user_id: actorUserId ?? farmId,
        //     after_json: { ...created, password_hash: "<hidden>" },
        // });

        return created;
    },

    async list(args: any) {
        return userRepo.list(args);
    },

    async get(id: string) {
        const row = await userRepo.findById(id);
        if (!row) throw httpError(404, "Usuário não encontrado");
        return row;
    },

    async update(id: string, patch: any, actorUserId: string) {
        const before = await this.get(id);

        try {
            const updated = await userRepo.update(id, {
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.email !== undefined ? { email: patch.email } : {}),
                ...(patch.role !== undefined ? { role: patch.role } : {}),
                ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
            });

            await auditLogService.log({
                entity_type: "user",
                entity_id: id,
                action: "UPDATE",
                changed_by_user_id: actorUserId,
                before_json: before,
                after_json: updated,
            });

            return updated;
        } catch (e: any) {
            if (e?.code === "P2025") throw httpError(404, "Usuário não encontrado");
            throw e;
        }
    },

    async deactivate(id: string, actorUserId: string) {
        const before = await this.get(id);
        if (before.is_active === false) return before;

        const updated = await userRepo.update(id, { is_active: false });

        await auditLogService.log({
            entity_type: "user",
            entity_id: id,
            action: "UPDATE",
            changed_by_user_id: actorUserId,
            before_json: before,
            after_json: updated,
        });

        return updated;
    },
};
