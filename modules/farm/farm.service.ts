import path from "path";
import { Prisma } from "../../generated/client/client";
import { auditLogService } from "../auditlog/auditLog.service";
import { documentService } from "../document/document.service";
import { farmRepo } from "./farm.repository";

function httpError(statusCode: number, message: string) {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function getFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

function assertFarmMapFile(file: Express.Multer.File | undefined) {
  if (!file) {
    throw httpError(400, "Arquivo do mapa é obrigatório (campo multipart: file)");
  }

  const extension = getFileExtension(file.originalname);

  const allowedExtensions = [".pdf", ".kml"];

  if (!allowedExtensions.includes(extension)) {
    throw httpError(400, "Mapa da fazenda deve ser um arquivo PDF ou KML");
  }
}

export const farmService = {
  async create(input: {
    name: string;
    location?: string;
    is_active?: boolean;
    farm_map_document_id?: string;
  }) {
    if (input.farm_map_document_id) {
      await documentService.get(input.farm_map_document_id);
    }

    try {
      return await farmRepo.create(input);
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        throw httpError(400, "farm_map_document_id inválido");
      }

      throw e;
    }
  },

  async list() {
    return farmRepo.list();
  },

  async get(id: string) {
    const farm = await farmRepo.getById(id);

    if (!farm) {
      throw httpError(404, "Farm não encontrada");
    }

    return farm;
  },

  async update(id: string, patch: any, actorUserId: string) {
    const before = await farmRepo.getById(id);

    if (!before) {
      throw httpError(404, "Farm não encontrada");
    }

    if (patch.farm_map_document_id) {
      await documentService.get(patch.farm_map_document_id);
    }

    try {
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
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        throw httpError(400, "farm_map_document_id inválido");
      }

      throw e;
    }
  },

  async uploadMap(
    farmId: string,
    file: Express.Multer.File | undefined,
    actorUserId: string,
    authFarmId: string
  ) {
    if (farmId !== authFarmId) {
      throw httpError(403, "Proibido: farm_id diferente do seu escopo");
    }

    assertFarmMapFile(file);

    const before = await farmRepo.getById(farmId);

    if (!before) {
      throw httpError(404, "Farm não encontrada");
    }

    const document = await documentService.createFromUpload(file, actorUserId, {
      folder: `plotpro/farms/${farmId}/maps`,
    });

    const updated = await farmRepo.update(farmId, {
      farm_map_document_id: document.id,
    });

    await auditLogService.log({
      entity_type: "farm",
      entity_id: farmId,
      action: "UPDATE",
      changed_by_user_id: actorUserId,
      before_json: before,
      after_json: updated,
    });

    return updated;
  },

  async removeMap(farmId: string, actorUserId: string, authFarmId: string) {
    if (farmId !== authFarmId) {
      throw httpError(403, "Proibido: farm_id diferente do seu escopo");
    }

    const before = await farmRepo.getById(farmId);

    if (!before) {
      throw httpError(404, "Farm não encontrada");
    }

    const updated = await farmRepo.update(farmId, {
      farm_map_document_id: null,
    });

    await auditLogService.log({
      entity_type: "farm",
      entity_id: farmId,
      action: "UPDATE",
      changed_by_user_id: actorUserId,
      before_json: before,
      after_json: updated,
    });

    return updated;
  },

  async deactivate(id: string, actorUserId: string) {
    const before = await farmRepo.getById(id);

    if (!before) {
      throw httpError(404, "Farm não encontrada");
    }

    const updated = await farmRepo.update(id, {
      is_active: false,
    });

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