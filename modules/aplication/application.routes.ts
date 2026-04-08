import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { applicationController } from "./application.controller";
import {
    cancelApplicationSchema,
    createApplicationSchema,
    getApplicationSchema,
    listApplicationsSchema,
    updateApplicationSchema,
} from "./application.schemas";

export const applicationRoutes = Router();

applicationRoutes.get("/", validate(listApplicationsSchema), applicationController.list);
applicationRoutes.get("/:eventId", validate(getApplicationSchema), applicationController.get);
applicationRoutes.post("/", validate(createApplicationSchema), applicationController.create);
applicationRoutes.patch("/:eventId", validate(updateApplicationSchema), applicationController.update);
applicationRoutes.post("/:eventId/cancel", validate(cancelApplicationSchema), applicationController.cancel);
