import { auditLogService } from "../auditlog/auditLog.service";
import { farmRepo } from "./farm.repository";

function httpError(statusCode: number, message: string) {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export const farmService = {
  async create(input: { name: string; location?: string; is_active?: boolean }) {
    return farmRepo.create(input);
  },
  async list() {
    return farmRepo.list();
  },
  async get(id: string) {
    const farm = await farmRepo.getById(id);
    if (!farm) {
      const err: any = new Error("Farm não encontrada");
      err.statusCode = 404;
      throw err;
    }
    return farm;
  },
  async update(id: string, patch: any, actorUserId: string) {
    const before = await farmRepo.getById(id);
    if (!before) throw httpError(404, "Farm não encontrada");

    const updated = await farmRepo.update(id, patch);

    await auditLogService.log({
      entity_type: "farm",
      entity_id: id,
      action: "UPDATE",
      changed_by_user_id: actorUserId,
      before_json: before,
      after_json: updated,
    });

    return updated;
  },

  async deactivate(id: string, actorUserId: string) {
    const before = await farmRepo.getById(id);
    if (!before) throw httpError(404, "Farm não encontrada");

    const updated = await farmRepo.update(id, { is_active: false });

    await auditLogService.log({
      entity_type: "farm",
      entity_id: id,
      action: "UPDATE",
      changed_by_user_id: actorUserId,
      before_json: before,
      after_json: updated,
    });

    return updated;
  },
};
