import multer from "multer";
import path from "path";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const allowedExtensions = new Set([
    ".pdf",
    ".kml",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
    ".txt",
]);

function getExtension(fileName: string) {
    return path.extname(fileName).toLowerCase();
}

export const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, cb) => {
        const extension = getExtension(file.originalname);

        if (!allowedExtensions.has(extension)) {
            return cb(new Error("Tipo de arquivo não permitido"));
        }

        cb(null, true);
    },
});