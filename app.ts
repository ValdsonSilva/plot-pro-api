import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./infra/http/error-handler";

import { farmRoutes } from "./modules/farm/farm.routes";
import { fieldRoutes } from "./modules/field/field.routes";
import { applicationRoutes } from "./modules/aplication/application.routes";
import { fieldEventRoutes } from "./modules/fieldEvent/fieldEvent.routes";
import { auditLogRoutes } from "./modules/auditlog/auditLog.routes";
import { documentRoutes } from "./modules/document/document.routes";
import { productRoutes } from "./modules/product/product.routes";
import { userRoutes } from "./modules/user/user.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { requireAuth } from "./infra/http/auth";
import { userController } from "./modules/user/user.controller";

export function buildApp() {
    const app = express();

    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",").map(s => s.trim()) ?? ["*"];

    app.use(helmet());
    app.use(cors({ origin: allowedOrigins }));
    app.use(express.json({ limit: "2mb" }));

    app.get("/health", (_req, res) => res.json({ ok: "API runnig good man! :)" }));

    // público
    app.use("/auth", authRoutes);
    app.post("/users", userController.create);

    app.use(requireAuth);

    // privadas
    app.use("/farms", farmRoutes);
    app.use("/fields", fieldRoutes);
    app.use("/field-events", fieldEventRoutes);
    app.use("/applications", applicationRoutes);
    app.use("/products", productRoutes);
    app.use("/documents", documentRoutes);
    app.use("/audit-logs", auditLogRoutes);
    app.use("/users", userRoutes);

    app.use(errorHandler);
    return app;
}
