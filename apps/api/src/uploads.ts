import fs from "fs";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

export const TRANSACTION_UPLOAD_DIR = path.join(process.cwd(), "uploads", "transaction-docs");

fs.mkdirSync(TRANSACTION_UPLOAD_DIR, { recursive: true });

export const transactionDocsUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TRANSACTION_UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".bin";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 40,
    fieldSize: 10 * 1024 * 1024,
  },
});

export function publicPathForUploadedFile(filename: string): string {
  return `/uploads/transaction-docs/${filename}`;
}

export function absolutePathFromPublicPath(publicPath: string): string {
  const base = path.basename(publicPath);
  return path.join(TRANSACTION_UPLOAD_DIR, base);
}
