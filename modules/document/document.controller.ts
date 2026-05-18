import type { Request, Response, NextFunction } from "express";
import { documentService } from "./document.service";
import { getActorUserId } from "../../infra/http/actor";

export const documentController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getActorUserId(req);

      if (!actor) {
        return res.status(400).json({ message: "userId é obrigatório" });
      }

      const created = await documentService.createFromUpload((req as any).file, actor);

      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = (req as any).validated;

      res.json(await documentService.list(query));
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { params } = (req as any).validated;

      res.json(await documentService.get(params.id));
    } catch (e) {
      next(e);
    }
  },

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { params } = (req as any).validated;
      const { doc, resolved } = await documentService.getDownloadPath(params.id);

      res.download(resolved, doc.file_name);
    } catch (e) {
      next(e);
    }
  },

  async raw(req: Request, res: Response, next: NextFunction) {
    try {
      const { params } = (req as any).validated;
      const { content } = await documentService.getRawContent(params.id);

      res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml; charset=utf-8");

      return res.status(200).send(content);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getActorUserId(req);

      if (!actor) {
        return res.status(400).json({ message: "userId é obrigatório" });
      }

      const { params } = (req as any).validated;

      res.json(await documentService.delete(params.id, actor));
    } catch (e) {
      next(e);
    }
  },
};