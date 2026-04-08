import { EventType } from "../../generated/client/enums";
import { prisma } from "../../infra/db/prisma";
import { forbiddenTypes } from "../../utils/forbiddenTypes";
import { auditLogService } from "../auditlog/auditLog.service";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

async function assertExists() {
    // placeholder (se você quiser colocar helpers globais depois)
}

interface Iitems {
    product_id: string,
    dose_per_ha: number,
    dose_unit: string,
    total_planned: number,
    total_unit: string,

    total_actual?: number,
    total_actual_unit?: string,
    spray_solution_l?: number,
    packaging_count?: number,
    packaging_type?: string,
}

export const applicationService = {
    async create(input: any, authFarmId: string) {
        // valida FK base
        console.log(input)
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

        // valida products em lote
        const productIds = [...new Set<string>(input.items.map((i: Iitems) => i.product_id))];
        const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
        if (products.length !== productIds.length) {
            console.log("Entrou")
            throw httpError(400, "Um ou mais product_id são inválidos");
        }

        try {
            const created = await prisma.$transaction(async (tx) => {
                const ev = await tx.fieldEvent.create({
                    data: {
                        field_id: input.field_id,
                        event_type: input.event_type,
                        status: input.status ?? "PLANNED",
                        start_at: input.start_at,
                        end_at: input.end_at,
                        responsible_user_id: input.responsible_user_id,
                        notes: input.notes,
                        source_document_id: input.source_document_id,
                    },
                });

                await tx.application.create({
                    data: {
                        event_id: ev.id,
                        application_name: input.application_name,
                        work_rate_value: input.work_rate_value as any,
                        work_rate_unit: input.work_rate_unit,
                        spray_volume_total_l: input.spray_volume_total_l as any,
                        spray_volume_l_per_ha: input.spray_volume_l_per_ha as any,
                        tank_count_planned: input.tank_count_planned,
                        tank_count_actual: input.tank_count_actual,
                        preferred_period: input.preferred_period,
                        wind_min_kmh: input.wind_min_kmh,
                        wind_max_kmh: input.wind_max_kmh,
                    },
                });

                await tx.applicationItem.createMany({
                    data: input.items.map((it: Iitems) => ({
                        event_id: ev.id,
                        product_id: it.product_id,  // o produto deve estar pré-cadastrado
                        dose_per_ha: it.dose_per_ha as any,
                        dose_unit: it.dose_unit,
                        total_planned: it.total_planned as any,
                        total_unit: it.total_unit,
                        total_actual: it.total_actual as any,
                        total_actual_unit: it.total_actual_unit,
                        spray_solution_l: it.spray_solution_l as any,
                        packaging_count: it.packaging_count,
                        packaging_type: it.packaging_type,
                    })),
                });

                return tx.fieldEvent.findUnique({
                    where: { id: ev.id },
                    include: {
                        field: { include: { farm: true } },
                        responsible_user: true,
                        source_document: true,
                        application: true,
                        application_items: { include: { product: true } },
                    },
                });
            });

            return created;
        } catch (e: any) {
            if (e?.code === "P2003") throw httpError(400, "Relacionamento inválido (FK)");
            if (e?.code === "P2002") throw httpError(409, "Conflito de unicidade");
            throw e;
        }
    },

    async get(eventId: string) {
        const row = await prisma.fieldEvent.findUnique({
            where: { id: eventId },
            include: {
                field: { include: { farm: true } },
                responsible_user: true,
                source_document: true,
                application: true,
                application_items: { include: { product: true } },
            },
        });

        if (!row) throw httpError(404, "Aplicação não encontrada");
        if (!forbiddenTypes.includes(row.event_type as any)) throw httpError(403, "Evento não é do tipo de aplicação de produto");
        return row;
    },

    async list(args: any, authFarmId: string) {
        if (!authFarmId) return httpError(400, "farmId é obrigatório");

        const { farmId, status, from, to, includeItems, event_type, skip = 0, take = 20 } = args;

        return prisma.fieldEvent.findMany({
            where: {
                event_type: event_type,
                field_id: authFarmId,
                status,
                ...(farmId ? { field: { farm_id: farmId } } : {}),
                ...(from || to
                    ? {
                        start_at: from ? { gte: from } : undefined,
                        end_at: to ? { lte: to } : undefined,
                    }
                    : {}),
            },
            include: {
                field: { include: { farm: true } },
                responsible_user: true,
                application: true,
                ...(includeItems ? { application_items: { include: { product: true } } } : {}),
            },
            orderBy: [{ start_at: "desc" }, { id: "desc" }],
            skip,
            take,
        });
    },

    async update(eventId: string, patch: any) {
        // garante que existe e é do tipo APPLICATION
        await this.get(eventId);

        if (patch.responsible_user_id) {
            const user = await prisma.user.findUnique({ where: { id: patch.responsible_user_id } });
            if (!user) throw httpError(404, "Usuário responsável não encontrado");
        }

        if (patch.source_document_id !== undefined) {
            if (patch.source_document_id === null) {
                // ok
            } else {
                const doc = await prisma.document.findUnique({ where: { id: patch.source_document_id } });
                if (!doc) throw httpError(404, "Documento não encontrado");
            }
        }

        if (patch.items) {
            const productIds = [...new Set<string>(patch.items.map((i: Iitems) => i.product_id))];
            const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
            if (products.length !== productIds.length) throw httpError(400, "Um ou mais product_id são inválidos");
        }

        try {
            const updated = await prisma.$transaction(async (tx) => {
                if (
                    patch.status !== undefined ||
                    patch.start_at !== undefined ||
                    patch.end_at !== undefined ||
                    patch.responsible_user_id !== undefined ||
                    patch.notes !== undefined ||
                    patch.source_document_id !== undefined
                ) {
                    await tx.fieldEvent.update({
                        where: { id: eventId },
                        data: {
                            ...(patch.status !== undefined ? { status: patch.status } : {}),
                            ...(patch.start_at !== undefined ? { start_at: patch.start_at } : {}),
                            ...(patch.end_at !== undefined ? { end_at: patch.end_at } : {}),
                            ...(patch.responsible_user_id !== undefined ? { responsible_user_id: patch.responsible_user_id } : {}),
                            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
                            ...(patch.source_document_id !== undefined ? { source_document_id: patch.source_document_id } : {}),
                        },
                    });
                }

                await tx.application.update({
                    where: { event_id: eventId },
                    data: {
                        ...(patch.application_name !== undefined ? { application_name: patch.application_name } : {}),
                        ...(patch.work_rate_value !== undefined ? { work_rate_value: patch.work_rate_value as any } : {}),
                        ...(patch.work_rate_unit !== undefined ? { work_rate_unit: patch.work_rate_unit } : {}),
                        ...(patch.spray_volume_total_l !== undefined ? { spray_volume_total_l: patch.spray_volume_total_l as any } : {}),
                        ...(patch.spray_volume_l_per_ha !== undefined ? { spray_volume_l_per_ha: patch.spray_volume_l_per_ha as any } : {}),
                        ...(patch.tank_count_planned !== undefined ? { tank_count_planned: patch.tank_count_planned } : {}),
                        ...(patch.tank_count_actual !== undefined ? { tank_count_actual: patch.tank_count_actual } : {}),
                        ...(patch.preferred_period !== undefined ? { preferred_period: patch.preferred_period } : {}),
                        ...(patch.wind_min_kmh !== undefined ? { wind_min_kmh: patch.wind_min_kmh } : {}),
                        ...(patch.wind_max_kmh !== undefined ? { wind_max_kmh: patch.wind_max_kmh } : {}),
                    },
                });

                if (patch.items) {
                    await tx.applicationItem.deleteMany({ where: { event_id: eventId } });
                    await tx.applicationItem.createMany({
                        data: patch.items.map((it: any) => ({
                            event_id: eventId,
                            product_id: it.product_id,
                            dose_per_ha: it.dose_per_ha as any,
                            dose_unit: it.dose_unit,
                            total_planned: it.total_planned as any,
                            total_unit: it.total_unit,
                            total_actual: it.total_actual as any,
                            total_actual_unit: it.total_actual_unit,
                            spray_solution_l: it.spray_solution_l as any,
                            packaging_count: it.packaging_count,
                            packaging_type: it.packaging_type,
                        })),
                    });
                }

                return tx.fieldEvent.findUnique({
                    where: { id: eventId },
                    include: {
                        field: { include: { farm: true } },
                        responsible_user: true,
                        source_document: true,
                        application: true,
                        application_items: { include: { product: true } },
                    },
                });
            });

            return updated;
        } catch (e: any) {
            if (e?.code === "P2025") throw httpError(404, "Aplicação não encontrada");
            throw e;
        }
    },

    async cancel(eventId: string, actorUserId: string) {
        const before = await this.get(eventId);

        const updated = await prisma.fieldEvent.update({
            where: { id: eventId },
            data: { status: "CANCELED" },
            include: {
                field: { include: { farm: true } },
                responsible_user: true,
                source_document: true,
                application: true,
                application_items: { include: { product: true } },
            },
        });

        await auditLogService.log({
            entity_type: "application",
            entity_id: eventId,
            action: "UPDATE",
            changed_by_user_id: actorUserId,
            before_json: before,
            after_json: updated,
        });

        return updated;
    },
};
