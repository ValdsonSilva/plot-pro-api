import fs from "fs/promises";
import path from "path";
import { documentRepo } from "./document.repository";
import { auditLogService } from "../auditlog/auditLog.service";
import { Prisma } from "../../generated/client/client";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

export const documentService = {
    async createFromUpload(file: Express.Multer.File | undefined, actorUserId: string) {
        if (!file) throw httpError(400, "Arquivo é obrigatório (campo multipart: file)");

        const created = await documentRepo.create({
            file_name: file.originalname,
            mime_type: file.mimetype,
            storage_path: file.path, // caminho absoluto no disco
        });

        await auditLogService.log({
            entity_type: "document",
            entity_id: created.id,
            action: "CREATE",
            changed_by_user_id: actorUserId,
            after_json: created,
        });

        return created;
    },

    async list(args: any) {
        return documentRepo.list(args);
    },

    async get(id: string) {
        const row = await documentRepo.findById(id);
        if (!row) throw httpError(404, "Documento não encontrado");
        return row;
    },

    async getDownloadPath(id: string) {
        const doc = await this.get(id);
        // garante que está dentro do storage/uploads
        const uploadsRoot = path.resolve(process.cwd(), "storage", "uploads");
        const resolved = path.resolve(doc.storage_path);
        if (!resolved.startsWith(uploadsRoot)) throw httpError(400, "Caminho inválido de arquivo");
        return { doc, resolved };
    },

    async delete(id: string, actorUserId: string) {
        const before = await this.get(id);

        try {
            const deleted = await documentRepo.delete(id);

            // tenta deletar o arquivo físico
            try {
                await fs.unlink(before.storage_path);
            } catch {
                // se já não existir, segue
            }

            await auditLogService.log({
                entity_type: "document",
                entity_id: id,
                action: "DELETE",
                changed_by_user_id: actorUserId,
                before_json: before,
            });

            return deleted;
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
                throw httpError(409, "Documento está vinculado a eventos e não pode ser excluído");
            }
            throw e;
        }
    },
};
