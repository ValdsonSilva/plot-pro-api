import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { userController } from "./user.controller";
import {
    createUserSchema,
    deactivateUserSchema,
    getUserSchema,
    listUsersSchema,
    updateUserSchema,
} from "./user.schema";

export const userRoutes = Router();

userRoutes.get("/", validate(listUsersSchema), userController.list);
userRoutes.get("/:id", validate(getUserSchema), userController.get);
// userRoutes.post("/", validate(createUserSchema), userController.create);
userRoutes.patch("/:id", validate(updateUserSchema), userController.update);
userRoutes.post("/:id/deactivate", validate(deactivateUserSchema), userController.deactivate);
