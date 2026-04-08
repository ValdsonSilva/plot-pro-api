import { FieldEvent } from "../../generated/client/client";
import { EventStatus, EventType } from "../../generated/client/enums";
import { prisma } from "../../infra/db/prisma";
import { auditLogService } from "../auditlog/auditLog.service";
import { fieldEventRepo } from "./fieldEvent.repository";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

export const fieldEventService = {
    async create(input: {
        field_id: string;
        event_type: EventType;
        status?: "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
        start_at: Date;
        end_at: Date;
        responsible_user_id: string;
        notes?: string;
        source_document_id?: string;
    }, authFarmId: string) {

        const field = await prisma.field.findUnique({ where: { id: input.field_id } });
        if (!field) throw httpError(404, "Talhão não encontrado");

        const user = await prisma.user.findUnique({ where: { id: input.responsible_user_id } });
        if (!user) throw httpError(404, "Usuário responsável não encontrado");

        if (input.source_document_id) {
            const doc = await prisma.document.findUnique({ where: { id: input.source_document_id } });
            if (!doc) throw httpError(404, "Documento não encontrado");
        }

        if (field.farm_id !== authFarmId) {
            const err: any = new Error("Proibido: farm_id diferente do seu escopo");
            err.statusCode = 403;
            throw err;
        }

        try {
            return await fieldEventRepo.create({
                ...input,
                event_type: input.event_type,
                status: input.status ?? "PLANNED",
            });
        } catch (e: any) {
            if (e?.code === "P2003") throw httpError(400, "Relacionamento inválido (FK)");
            throw e;
        }
    },

    async list(args: any, authFarmId: string): Promise<FieldEvent[]> {
        if (!authFarmId) return httpError(400, "farmId é obrigatório");
        return fieldEventRepo.list({ ...args, farmId: authFarmId });
    },

    async get(id: string) {
        const ev = await fieldEventRepo.findById(id);
        if (!ev) throw httpError(404, "Evento não encontrado");
        return ev;
    },

    async update(
        id: string,
        patch: {
            eventType?: "SOIL_PLOWING" | "SOIL_HARROWING" | "SOIL_SUBSOILING" | "LIMING" | "GYPSUM_APPLICATION" | "PLANTING" | "FERTILIZATION" | "PESTICIDE_APPLICATION" | "IRRIGATION" | "HARVEST" | "MONITORING"
            status?: "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
            start_at?: Date;
            end_at?: Date;
            responsible_user_id?: string;
            notes?: string | null;
            source_document_id?: string | null;
        }
    ) {
        const current = await this.get(id);

        console.log({ current })

        if (patch.start_at && (patch.end_at ?? current.end_at) && patch.start_at > (patch.end_at ?? current.end_at)) {
            throw httpError(400, "start_at deve ser <= end_at");
        }
        if (patch.end_at && (patch.start_at ?? current.start_at) && (patch.start_at ?? current.start_at) > patch.end_at) {
            throw httpError(400, "start_at deve ser <= end_at");
        }

        if (patch.responsible_user_id) {
            const user = await prisma.user.findUnique({ where: { id: patch.responsible_user_id } });
            if (!user) throw httpError(404, "Usuário responsável não encontrado");
        }

        if (patch.source_document_id !== undefined) {
            if (patch.source_document_id === null) {
                // ok (remover)
            } else {
                const doc = await prisma.document.findUnique({ where: { id: patch.source_document_id } });
                if (!doc) throw httpError(404, "Documento não encontrado");
            }
        }

        try {
            const data: any = {
                event_type: patch.eventType,
                status: patch.status,
                start_at: patch.start_at,
                end_at: patch.end_at,
                responsible_user_id: patch.responsible_user_id,
                notes: patch.notes,
                source_document_id: patch.source_document_id,
            };

            // Remove apenas as chaves que são estritamente undefined
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

            return await fieldEventRepo.update(id, data);
        } catch (e: any) {
            if (e?.code === "P2025") throw httpError(404, "Evento não encontrado");
            throw e;
        }
    },

    // cancelar um evento sobre o talhão
    async cancel(id: string, actorUserId: string) {
        const before = await this.get(id);
        // if (before.event_type !== "OTHER") {
        //     const err: any = new Error("Use /applications/:eventId/cancel para APPLICATION");
        //     err.statusCode = 409;
        //     throw err;
        // }

        const updated = await fieldEventRepo.update(id, { status: "CANCELED" });

        await auditLogService.log({
            entity_type: "fieldEvent",
            entity_id: id,
            action: "UPDATE",
            changed_by_user_id: actorUserId,
            before_json: before,
            after_json: updated,
        });

        return updated;
    },
};
