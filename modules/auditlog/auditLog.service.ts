import { prisma } from "../../infra/db/prisma";
import { auditLogRepo } from "./auditLog.repository";

function httpError(statusCode: number, message: string) {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
}

export const auditLogService = {
    async list(args: any) {
        return auditLogRepo.list(args);
    },

    async log(data: {
        entity_type: string;
        entity_id: string;
        action: "CREATE" | "UPDATE" | "DELETE";
        changed_by_user_id: string;
        before_json?: any;
        after_json?: any;
    }) {
        const user = await prisma.user.findUnique({ where: { id: data.changed_by_user_id } });
        if (!user) throw httpError(404, "Usuário não encontrado para auditoria");
        return auditLogRepo.create(data);
    },
};
