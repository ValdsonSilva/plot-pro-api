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

type ExecutionMethod = "DISTRIBUTING" | "INCORPORATION";
type SeedQuantityUnit = "SEED_M" | "KG_HA";

function ensureValidPlantingPayload(data: {
    event_type?: EventType | string;
    execution_method?: ExecutionMethod | null;
    crop?: string | null;
    variety?: string | null;
    seed_quantity?: number | null;
    seed_quantity_unit?: SeedQuantityUnit | null;
    rainfall_mm?: number | null;
}) {
    if (data.event_type !== "PLANTING") return;

    if (!data.execution_method) throw httpError(400, "Método de execução é obrigatório para evento de plantio");
    if (!data.crop?.trim()) throw httpError(400, "Cultura é obrigatória para evento de plantio");
    if (!data.variety?.trim()) throw httpError(400, "Variedade é obrigatória para evento de plantio");
    if (data.seed_quantity === undefined || data.seed_quantity === null) throw httpError(400, "Quantidade de sementes é obrigatória para evento de plantio");
    if (!data.seed_quantity_unit) throw httpError(400, "Unidade da quantidade de sementes é obrigatória para evento de plantio");
    if (data.rainfall_mm === undefined || data.rainfall_mm === null) throw httpError(400, "Pluviometria do dia é obrigatória para evento de plantio");
}

function clearPlantingFieldsIfNotPlanting(eventType: EventType | string, data: any) {
    if (eventType === "PLANTING") return data;

    return {
        ...data,
        execution_method: null,
        crop: null,
        variety: null,
        seed_quantity: null,
        seed_quantity_unit: null,
        rainfall_mm: null,
    };
}

export const fieldEventService = {
    async create(input: {
        field_id: string;
        event_type: EventType;
        status?: EventStatus;
        start_at: Date;
        end_at: Date;
        responsible_user_id: string;
        notes?: string;
        source_document_id?: string;
        execution_method?: ExecutionMethod;
        crop?: string;
        variety?: string;
        seed_quantity?: number;
        seed_quantity_unit?: SeedQuantityUnit;
        rainfall_mm?: number;
    }, authFarmId: string) {

        const field = await prisma.field.findUnique({ where: { id: input.field_id } });
        if (!field) throw httpError(404, "Talhão não encontrado");

        const user = await prisma.user.findUnique({ where: { id: input.responsible_user_id } });
        if (!user) throw httpError(404, "Usuário responsável não encontrado");

        if (user.farm_id !== authFarmId) {
            throw httpError(403, "Proibido: usuário responsável pertence a outra fazenda");
        }

        if (input.source_document_id) {
            const doc = await prisma.document.findUnique({ where: { id: input.source_document_id } });
            if (!doc) throw httpError(404, "Documento não encontrado");
        }

        if (field.farm_id !== authFarmId) {
            throw httpError(403, "Proibido: farm_id diferente do seu escopo");
        }

        ensureValidPlantingPayload(input);

        try {
            const data = clearPlantingFieldsIfNotPlanting(input.event_type, {
                ...input,
                event_type: input.event_type,
                status: input.status ?? "PLANNED",
            });

            return await fieldEventRepo.create(data);
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
            event_type?: EventType;
            status?: EventStatus;
            start_at?: Date;
            end_at?: Date;
            responsible_user_id?: string;
            notes?: string | null;
            source_document_id?: string | null;
            execution_method?: ExecutionMethod | null;
            crop?: string | null;
            variety?: string | null;
            seed_quantity?: number | null;
            seed_quantity_unit?: SeedQuantityUnit | null;
            rainfall_mm?: number | null;
        }
    ) {
        const current = await this.get(id);

        if (patch.start_at && (patch.end_at ?? current.end_at) && patch.start_at > (patch.end_at ?? current.end_at)) {
            throw httpError(400, "start_at deve ser <= end_at");
        }
        if (patch.end_at && (patch.start_at ?? current.start_at) && (patch.start_at ?? current.start_at) > patch.end_at) {
            throw httpError(400, "start_at deve ser <= end_at");
        }

        if (patch.responsible_user_id) {
            const user = await prisma.user.findUnique({ where: { id: patch.responsible_user_id } });
            if (!user) throw httpError(404, "Usuário responsável não encontrado");
            if (user.farm_id !== current.field.farm_id) {
                throw httpError(403, "Proibido: usuário responsável pertence a outra fazenda");
            }
        }

        if (patch.source_document_id !== undefined) {
            if (patch.source_document_id === null) {
                // ok (remover)
            } else {
                const doc = await prisma.document.findUnique({ where: { id: patch.source_document_id } });
                if (!doc) throw httpError(404, "Documento não encontrado");
            }
        }

        const merged = {
            event_type: patch.event_type ?? current.event_type,
            execution_method: patch.execution_method !== undefined ? patch.execution_method : current.execution_method,
            crop: patch.crop !== undefined ? patch.crop : current.crop,
            variety: patch.variety !== undefined ? patch.variety : current.variety,
            seed_quantity: patch.seed_quantity !== undefined ? patch.seed_quantity : current.seed_quantity ? Number(current.seed_quantity) : null,
            seed_quantity_unit: patch.seed_quantity_unit !== undefined ? patch.seed_quantity_unit : current.seed_quantity_unit,
            rainfall_mm: patch.rainfall_mm !== undefined ? patch.rainfall_mm : current.rainfall_mm ? Number(current.rainfall_mm) : null,
        };

        ensureValidPlantingPayload(merged);

        try {
            let data: any = {
                event_type: patch.event_type,
                status: patch.status,
                start_at: patch.start_at,
                end_at: patch.end_at,
                responsible_user_id: patch.responsible_user_id,
                notes: patch.notes,
                source_document_id: patch.source_document_id,
                execution_method: patch.execution_method,
                crop: patch.crop,
                variety: patch.variety,
                seed_quantity: patch.seed_quantity as any,
                seed_quantity_unit: patch.seed_quantity_unit,
                rainfall_mm: patch.rainfall_mm as any,
            };

            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

            data = clearPlantingFieldsIfNotPlanting(merged.event_type, data);

            return await fieldEventRepo.update(id, data);
        } catch (e: any) {
            if (e?.code === "P2025") throw httpError(404, "Evento não encontrado");
            throw e;
        }
    },

    async cancel(id: string, actorUserId: string) {
        const before = await this.get(id);

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