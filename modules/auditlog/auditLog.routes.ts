import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { auditLogController } from "./auditLog.controller";
import { listAuditLogsSchema } from "./auditLog.schema";

export const auditLogRoutes = Router();

auditLogRoutes.get("/", validate(listAuditLogsSchema), auditLogController.list);
