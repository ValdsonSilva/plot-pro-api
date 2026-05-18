import { Router } from "express";
import { validate } from "../../infra/http/validate";
import { documentController } from "./document.controller";
import { documentUpload } from "./document.upload";
import {
    deleteDocumentSchema,
    getDocumentSchema,
    getRawDocumentSchema,
    listDocumentsSchema,
} from "./document.schemas";

export const documentRoutes = Router();

documentRoutes.get("/", validate(listDocumentsSchema), documentController.list);

documentRoutes.get("/:id/raw", validate(getRawDocumentSchema), documentController.raw);

documentRoutes.get("/:id/download", validate(getDocumentSchema), documentController.download);

documentRoutes.get("/:id", validate(getDocumentSchema), documentController.get);

documentRoutes.post(
    "/upload",
    documentUpload.single("file"),
    documentController.upload
);

documentRoutes.delete("/:id", validate(deleteDocumentSchema), documentController.delete);