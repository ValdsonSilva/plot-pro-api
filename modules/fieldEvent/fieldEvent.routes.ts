import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { fieldEventController } from "./fieldEvent.controller";
import {
    cancelFieldEventSchema,
    createFieldEventSchema,
    getFieldEventSchema,
    listFieldEventsSchema,
    updateFieldEventSchema,
} from "./fieldEvent.schema";

export const fieldEventRoutes = Router();

fieldEventRoutes.get("/", validate(listFieldEventsSchema), fieldEventController.list);
fieldEventRoutes.get("/:id", validate(getFieldEventSchema), fieldEventController.get);
fieldEventRoutes.post("/", validate(createFieldEventSchema), fieldEventController.create);
fieldEventRoutes.patch("/:id", validate(updateFieldEventSchema), fieldEventController.update);
fieldEventRoutes.post("/:id/cancel", validate(cancelFieldEventSchema), fieldEventController.cancel);
