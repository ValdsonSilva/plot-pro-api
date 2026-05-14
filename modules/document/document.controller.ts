import type { Request, Response, NextFunction } from "express";
import { getActorUserId } from "../../infra/http/actor";
import { documentService } from "./document.service";

export const documentController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getActorUserId(req);

      if (!actor) {
        return res.status(401).json({ message: "Usuário autenticado não encontrado" });
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
      const { doc, url, resolved } = await documentService.getDownloadData(params.id);

      if (url) {
        return res.redirect(url);
      }

      if (!resolved) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }

      return res.download(resolved, doc.file_name);
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getActorUserId(req);

      if (!actor) {
        return res.status(401).json({ message: "Usuário autenticado não encontrado" });
      }

      const { params } = (req as any).validated;

      res.json(await documentService.delete(params.id, actor));
    } catch (e) {
      next(e);
    }
  },
};