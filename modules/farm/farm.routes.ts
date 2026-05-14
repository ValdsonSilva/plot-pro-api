import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { documentUpload } from "../document/document.upload";
import { farmController } from "./farm.controller";
import {
    createFarmSchema,
    deactivateFarmSchema,
    removeFarmMapSchema,
    updateFarmSchema,
    uploadFarmMapSchema,
} from "./farm.schemas";

export const farmRoutes = Router();

farmRoutes.get("/", farmController.list);
farmRoutes.get("/:id", farmController.get);
farmRoutes.post("/", validate(createFarmSchema), farmController.create);
farmRoutes.patch("/:id", validate(updateFarmSchema), farmController.update);
farmRoutes.post("/:id/map", validate(uploadFarmMapSchema), documentUpload.single("file"), farmController.uploadMap);
farmRoutes.delete("/:id/map", validate(removeFarmMapSchema), farmController.removeMap);
farmRoutes.post("/:id/deactivate", validate(deactivateFarmSchema), farmController.deactivate);