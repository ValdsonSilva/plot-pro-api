import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { requireAuth } from "../../infra/http/auth";
import { authController } from "./auth.controller";
import { loginSchema } from "./auth.schemas";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), authController.login);
authRoutes.get("/me", requireAuth, authController.me);

// {
//     "email": "admin@gmail.com",
//     "password": "12345678"
// }