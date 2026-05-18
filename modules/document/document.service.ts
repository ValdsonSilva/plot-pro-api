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

function isRemoteUrl(value: string) {
    return value.startsWith("http://") || value.startsWith("https://");
}

function getDocumentUrl(doc: any) {
    return doc.secure_url || doc.storage_path;
}

function isImageMimeType(mimeType: string) {
    return mimeType.startsWith("image/");
}

function getCloudinaryResourceType(mimeType: string) {
    if (isImageMimeType(mimeType)) return "image";
    return "raw";
}

function isKmlDocument(doc: any) {
    const fileName = String(doc.file_name || "").toLowerCase();
    const mimeType = String(doc.mime_type || "").toLowerCase();

    return (
        fileName.endsWith(".kml") ||
        mimeType.includes("kml") ||
        mimeType === "application/vnd.google-earth.kml+xml" ||
        mimeType === "application/octet-stream" ||
        mimeType === "text/xml" ||
        mimeType === "application/xml"
    );
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

        if (!file.buffer) {
            throw httpError(400, "Arquivo inválido: buffer não encontrado no upload");
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

        if (doc.secure_url || isRemoteUrl(doc.storage_path)) {
            return {
                doc,
                url: doc.secure_url || doc.storage_path,
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

    async getRawContent(id: string) {
        const doc = await this.get(id);

        if (!isKmlDocument(doc)) {
            throw httpError(400, "A rota raw está disponível apenas para arquivos KML/XML");
        }

        const source = getDocumentUrl(doc);

        if (!source) {
            throw httpError(404, "Arquivo do documento não encontrado");
        }

        if (isRemoteUrl(source)) {
            const response = await fetch(source);

            if (!response.ok) {
                throw httpError(
                    response.status,
                    `Erro ao baixar arquivo remoto: ${response.statusText}`
                );
            }

            return {
                doc,
                content: await response.text(),
            };
        }

        const uploadsRoot = path.resolve(process.cwd(), "storage", "uploads");
        const resolved = path.resolve(source);

        if (!resolved.startsWith(uploadsRoot)) {
            throw httpError(400, "Caminho inválido de arquivo");
        }

        return {
            doc,
            content: await fs.readFile(resolved, "utf-8"),
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
                throw httpError(
                    409,
                    "Documento está vinculado a eventos, talhões ou fazendas e não pode ser excluído"
                );
            }

            throw e;
        }
    },
};