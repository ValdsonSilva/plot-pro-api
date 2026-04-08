import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function safeBaseName(name: string) {
    return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export const documentUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
            const ts = Date.now();
            const base = safeBaseName(file.originalname);
            cb(null, `${ts}-${Math.random().toString(16).slice(2)}-${base}`);
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
