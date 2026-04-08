import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { fieldController } from "./field.controller";
import { createFieldSchema, deactivateFieldSchema, getFieldSchema, listFieldsSchema, updateFieldSchema } from "./field.schemas";

export const fieldRoutes = Router();

fieldRoutes.get("/", validate(listFieldsSchema), fieldController.list);
fieldRoutes.get("/:id", validate(getFieldSchema), fieldController.get);
fieldRoutes.post("/", validate(createFieldSchema), fieldController.create);
fieldRoutes.patch("/:id", validate(updateFieldSchema), fieldController.update);
fieldRoutes.post("/:id/deactivate", validate(deactivateFieldSchema), fieldController.deactivate);

