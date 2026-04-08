import { Router } from "express";
import { farmController } from "./farm.controller";
import { validate } from "../../infra/http/validate";
import { createFarmSchema, deactivateFarmSchema, updateFarmSchema } from "./farm.schemas";

export const farmRoutes = Router();

farmRoutes.get("/", farmController.list);
farmRoutes.get("/:id", farmController.get);
farmRoutes.post("/", validate(createFarmSchema), farmController.create);
farmRoutes.patch("/:id", validate(updateFarmSchema), farmController.update);
farmRoutes.post("/:id/deactivate", validate(deactivateFarmSchema), farmController.deactivate);
