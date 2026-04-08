import { prisma } from "../../infra/db/prisma";

export const auditLogRepo = {
    list(args: {
        entityType?: string;
        entityId?: string;
        changedByUserId?: string;
        action?: "CREATE" | "UPDATE" | "DELETE";
        skip?: number;
        take?: number;
    }) {
        const { entityType, entityId, changedByUserId, action, skip = 0, take = 50 } = args;

        return prisma.auditLog.findMany({
            where: {
                entity_type: entityType,
                entity_id: entityId,
                changed_by_user_id: changedByUserId,
                action,
            },
            include: { changed_by_user: true },
            orderBy: [{ changed_at: "desc" }, { id: "desc" }],
            skip,
            take,
        });
    },

    create(data: {
        entity_type: string;
        entity_id: string;
        action: "CREATE" | "UPDATE" | "DELETE";
        changed_by_user_id: string;
        before_json?: any;
        after_json?: any;
    }) {
        return prisma.auditLog.create({
            data: {
                entity_type: data.entity_type,
                entity_id: data.entity_id,
                action: data.action,
                changed_by_user_id: data.changed_by_user_id,
                before_json: data.before_json,
                after_json: data.after_json,
            },
        });
    },
};
