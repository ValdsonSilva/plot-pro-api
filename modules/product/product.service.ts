import { Prisma } from "../../generated/client/client";
import { auditLogService } from "../auditlog/auditLog.service";
import { productRepo } from "./product.repository";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

export const productService = {
    async create(input: any, actorUserId: string) {
        const created = await productRepo.create(input);

        await auditLogService.log({
            entity_type: "product",
            entity_id: created.id,
            action: "CREATE",
            changed_by_user_id: actorUserId,
            after_json: created,
        });

        return created;
    },

    async list(args: any) {
        return productRepo.list(args);
    },

    async get(id: string) {
        const row = await productRepo.findById(id);
        if (!row) throw httpError(404, "Produto não encontrado");
        return row;
    },

    async update(id: string, patch: any, actorUserId: string) {
        const before = await this.get(id);

        try {
            const updated = await productRepo.update(id, patch);

            await auditLogService.log({
                entity_type: "product",
                entity_id: id,
                action: "UPDATE",
                changed_by_user_id: actorUserId,
                before_json: before,
                after_json: updated,
            });

            return updated;
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
                throw httpError(404, "Produto não encontrado");
            }
            throw e;
        }
    },

    async delete(id: string, actorUserId: string) {
        const before = await this.get(id);

        try {
            const deleted = await productRepo.delete(id);

            await auditLogService.log({
                entity_type: "product",
                entity_id: id,
                action: "DELETE",
                changed_by_user_id: actorUserId,
                before_json: before,
            });

            return deleted;
        } catch (e: any) {
            // Se já houver itens de aplicação usando o produto, o banco pode bloquear (FK)
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
                throw httpError(409, "Produto está vinculado a aplicações e não pode ser excluído");
            }
            throw e;
        }
    },
};
