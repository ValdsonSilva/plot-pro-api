import { FieldEvent } from "../../generated/client/client";
import { EventType } from "../../generated/client/enums";
import { prisma } from "../../infra/db/prisma";

type ListArgs = {
    fieldId?: string;
    farmId?: string;
    eventType?: EventType;
    status?: "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
    responsibleUserId?: string;
    from?: Date;
    to?: Date;
    includeApplication?: boolean;
    skip?: number;
    take?: number;
};

export const fieldEventRepo = {
    create(data: {
        field_id: string;
        event_type: EventType;
        status: "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
        start_at: Date;
        end_at: Date;
        responsible_user_id: string;
        notes?: string;
        source_document_id?: string;
    }) {
        return prisma.fieldEvent.create({
            data: {
                field_id: data.field_id,
                event_type: data.event_type,
                status: data.status,
                start_at: data.start_at,
                end_at: data.end_at,
                responsible_user_id: data.responsible_user_id,
                notes: data.notes,
                source_document_id: data.source_document_id,
            },
            include: {
                field: { include: { farm: true } },
                responsible_user: true,
            },
        });
    },

    findById(id: string) {
        return prisma.fieldEvent.findUnique({
            where: { id },
            include: {
                field: { include: { farm: true } },
                responsible_user: true,
                source_document: true,
                application: true,
                application_items: { include: { product: true } },
            },
        });
    },

    list(args: ListArgs) {
        const {
            fieldId,
            farmId,
            eventType,
            status,
            responsibleUserId,
            from,
            to,
            includeApplication,
            skip = 0,
            take = 20,
        } = args;

        return prisma.fieldEvent.findMany({
            where: {
                field_id: fieldId,
                event_type: eventType,
                status,
                responsible_user_id: responsibleUserId,
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
                ...(includeApplication
                    ? { application: true }
                    : {}),

            },
            orderBy: [{ start_at: "desc" }, { id: "desc" }],
            skip,
            take,
        });
    },

    update(id: string, data: FieldEvent) {
        return prisma.fieldEvent.update({
            where: { id },
            data,
            include: {
                field: { include: { farm: true } },
                responsible_user: true,
                source_document: true,
            },
        });
    },
};
