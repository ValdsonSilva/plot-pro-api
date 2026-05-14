import fs from "fs/promises";
import path from "path";
import { Prisma } from "../../generated/client/client";
import { auditLogService } from "../auditlog/auditLog.service";
import { cloudinaryService } from "../cloudinary/cloudinary.service";
import { documentRepo } from "./document.repository";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

function isImageMimeType(mimeType: string) {
    return mimeType.startsWith("image/");
}

function getCloudinaryResourceType(mimeType: string) {
    if (isImageMimeType(mimeType)) return "image";
    return "raw";
}

export const documentService = {
    async createFromUpload(
        file: Express.Multer.File | undefined,
        actorUserId: string,
        options?: {
            folder?: string;
        }
    ) {
        if (!file) {
            throw httpError(400, "Arquivo é obrigatório (campo multipart: file)");
        }

        const resourceType = getCloudinaryResourceType(file.mimetype);

        const uploaded = await cloudinaryService.uploadBuffer({
            buffer: file.buffer,
            originalName: file.originalname,
            folder: options?.folder ?? "plotpro/documents",
            resourceType,
        });

        const created = await documentRepo.create({
            file_name: file.originalname,
            mime_type: file.mimetype,
            storage_path: uploaded.secure_url,
            storage_provider: "CLOUDINARY",
            storage_key: uploaded.public_id,
            public_url: uploaded.url,
            secure_url: uploaded.secure_url,
            resource_type: uploaded.resource_type,
            file_size_bytes: uploaded.bytes,
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

        if (!row) {
            throw httpError(404, "Documento não encontrado");
        }

        return row;
    },

    async getDownloadData(id: string) {
        const doc = await this.get(id);

        if (doc.storage_provider === "CLOUDINARY" && doc.secure_url) {
            return {
                doc,
                url: doc.secure_url,
                resolved: null,
            };
        }

        const uploadsRoot = path.resolve(process.cwd(), "storage", "uploads");
        const resolved = path.resolve(doc.storage_path);

        if (!resolved.startsWith(uploadsRoot)) {
            throw httpError(400, "Caminho inválido de arquivo");
        }

        return {
            doc,
            url: null,
            resolved,
        };
    },

    async delete(id: string, actorUserId: string) {
        const before = await this.get(id);

        try {
            const deleted = await documentRepo.delete(id);

            if (before.storage_provider === "CLOUDINARY" && before.storage_key) {
                try {
                    await cloudinaryService.deleteFile(
                        before.storage_key,
                        before.resource_type ?? "raw"
                    );
                } catch {
                    // Não bloqueia a exclusão do registro caso a remoção no Cloudinary falhe.
                }
            } else {
                try {
                    await fs.unlink(before.storage_path);
                } catch {
                    // Se o arquivo local não existir, segue.
                }
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
                throw httpError(409, "Documento está vinculado a eventos, talhões ou fazendas e não pode ser excluído");
            }

            throw e;
        }
    },
};