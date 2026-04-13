import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { signAuthToken, UserRole, verifyAuthToken } from "./auth.js";
import { connectDb } from "./db.js";
import { EmployeeModel } from "./models.js";
import { createTransactionPayloadSchema, updateTransactionPayloadSchema } from "./transactionSchemas.js";
import {
  createClient,
  createEmployee,
  createShippingCompany,
  createTransaction,
  deleteClient,
  deleteEmployee,
  deleteShippingCompany,
  deleteTransaction,
  getTransaction,
  issueRelease,
  listClients,
  listEmployees,
  listShippingCompanies,
  listTransactions,
  markOriginalBl,
  markPaid,
  updateEmployee,
  updateShippingCompany,
  updateClient,
  updateTransaction,
} from "./store.js";
import type { DocumentAttachment } from "./types.js";
import { absolutePathFromPublicPath, publicPathForUploadedFile, transactionDocsUpload } from "./uploads.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

function authenticate(req: AuthRequest, res: Response, next: () => void) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = payload;
  next();
}

function ensureRole(req: AuthRequest, res: Response, allowed: UserRole[]) {
  const role = req.user?.role;
  if (!role || !allowed.includes(role)) {
    res.status(403).json({ error: `Role '${role}' is not allowed for this action` });
    return null;
  }
  return role;
}

function maybeUpload(req: Request, res: Response, next: () => void) {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    transactionDocsUpload.array("documentPhotos", 40)(req, res, next);
  } else {
    next();
  }
}

function parseExistingAttachmentsJson(raw: unknown): DocumentAttachment[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: DocumentAttachment[] = [];
    for (const item of v) {
      if (
        typeof item === "object" &&
        item !== null &&
        typeof (item as { path?: unknown }).path === "string" &&
        typeof (item as { originalName?: unknown }).originalName === "string"
      ) {
        out.push({
          path: (item as DocumentAttachment).path,
          originalName: (item as DocumentAttachment).originalName,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function removeOrphanFiles(previous: DocumentAttachment[] | undefined, merged: DocumentAttachment[]) {
  const prev = new Set((previous ?? []).map((a) => a.path));
  const next = new Set(merged.map((a) => a.path));
  for (const p of prev) {
    if (!next.has(p)) {
      try {
        await fs.unlink(absolutePathFromPublicPath(p));
      } catch {
        /* ignore missing file */
      }
    }
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });

  const email = result.data.email.toLowerCase().trim();
  const user = (await EmployeeModel.findOne({ email }).lean()) as
    | { _id: string; email: string; name: string; role: UserRole; password: string }
    | null;
  if (!user || user.password !== result.data.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signAuthToken({
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return res.json({
    token,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

app.post("/api/auth/logout", (_req, res) => {
  return res.json({ ok: true });
});

app.get("/api/auth/me", authenticate, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

const optionalEmployeePassword = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().min(4).optional(),
);

app.get("/api/employees", authenticate, async (_req, res) => {
  res.json(await listEmployees());
});

app.post("/api/employees", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(4),
    role: z.enum(["manager", "employee", "accountant"]),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  try {
    return res.status(201).json(await createEmployee(result.data));
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return res.status(409).json({ error: "email_taken" });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/employees/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const schema = z
    .object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      password: optionalEmployeePassword,
      role: z.enum(["manager", "employee", "accountant"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required");

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  if (result.data.role !== undefined && result.data.role !== "manager") {
    const current = (await EmployeeModel.findById(req.params.id).lean()) as { role?: UserRole } | null;
    if (current?.role === "manager") {
      const managers = await EmployeeModel.countDocuments({ role: "manager" });
      if (managers <= 1) {
        return res.status(400).json({ error: "last_manager_role" });
      }
    }
  }

  try {
    const updated = await updateEmployee(req.params.id, result.data);
    if (!updated) return res.status(404).json({ error: "Employee not found" });
    return res.json(updated);
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return res.status(409).json({ error: "email_taken" });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/employees/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  if (req.params.id === req.user?.id) {
    return res.status(400).json({ error: "delete_self" });
  }
  const target = (await EmployeeModel.findById(req.params.id).lean()) as { role?: UserRole } | null;
  if (!target) return res.status(404).json({ error: "Employee not found" });
  if (target.role === "manager") {
    const managers = await EmployeeModel.countDocuments({ role: "manager" });
    if (managers <= 1) {
      return res.status(400).json({ error: "last_manager_delete" });
    }
  }
  const ok = await deleteEmployee(req.params.id);
  if (!ok) return res.status(404).json({ error: "Employee not found" });
  return res.status(204).send();
});

app.get("/api/clients", authenticate, async (_req, res) => {
  res.json(await listClients());
});

const optionalClientEmail = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().email().optional(),
);
const optionalClientCountry = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().optional(),
);

app.post("/api/clients", authenticate, async (req, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const schema = z.object({
    companyName: z.string().min(2),
    trn: z.string().min(2),
    immigrationCode: z.string().optional(),
    email: optionalClientEmail,
    country: optionalClientCountry,
    creditLimit: z.number().nonnegative().default(0),
    status: z.enum(["active", "suspended"]).default("active"),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  return res.status(201).json(await createClient(result.data));
});

app.put("/api/clients/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const schema = z
    .object({
      companyName: z.string().min(2).optional(),
      trn: z.string().min(2).optional(),
      immigrationCode: z.string().optional(),
      email: optionalClientEmail,
      country: optionalClientCountry,
      creditLimit: z.number().nonnegative().optional(),
      status: z.enum(["active", "suspended"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required");

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  const client = await updateClient(req.params.id, result.data);
  if (!client) return res.status(404).json({ error: "Client not found" });
  return res.json(client);
});

app.delete("/api/clients/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const ok = await deleteClient(req.params.id);
  if (!ok) return res.status(404).json({ error: "Client not found" });
  return res.status(204).send();
});

app.get("/api/shipping-companies", authenticate, async (_req, res) => {
  res.json(await listShippingCompanies());
});

app.post("/api/shipping-companies", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const schema = z
    .object({
      companyName: z.string().min(2),
      code: z.string().min(2),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      email: z.preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.string().email().optional(),
      ),
      dispatchFormTemplate: z.string().max(8000).optional(),
      latitude: z.number().gte(-90).lte(90).optional(),
      longitude: z.number().gte(-180).lte(180).optional(),
      status: z.enum(["active", "inactive"]).default("active"),
    })
    .refine(
      (d) =>
        (d.latitude === undefined && d.longitude === undefined) ||
        (d.latitude !== undefined && d.longitude !== undefined),
      { message: "latitude and longitude must both be set or both omitted", path: ["latitude"] },
    );
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  return res.status(201).json(await createShippingCompany(result.data));
});

app.put("/api/shipping-companies/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const schema = z
    .object({
      companyName: z.string().min(2).optional(),
      code: z.string().min(2).optional(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      email: z.preprocess(
        (v) => (v === "" || v === null ? null : v === undefined ? undefined : v),
        z.union([z.string().email(), z.null()]).optional(),
      ),
      dispatchFormTemplate: z.union([z.string().max(8000), z.null()]).optional(),
      latitude: z.union([z.number().gte(-90).lte(90), z.null()]).optional(),
      longitude: z.union([z.number().gte(-180).lte(180), z.null()]).optional(),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
    .refine(
      (d) =>
        (d.latitude === undefined && d.longitude === undefined) ||
        (d.latitude !== undefined && d.longitude !== undefined) ||
        (d.latitude === null && d.longitude === null),
      { message: "latitude and longitude must both be set, both omitted, or both null", path: ["latitude"] },
    );
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  const item = await updateShippingCompany(req.params.id, result.data);
  if (!item) return res.status(404).json({ error: "Shipping company not found" });
  return res.json(item);
});

app.delete("/api/shipping-companies/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager"]);
  if (!denied) return;
  const ok = await deleteShippingCompany(req.params.id);
  if (!ok) return res.status(404).json({ error: "Shipping company not found" });
  return res.status(204).send();
});

app.get("/api/transactions", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager", "employee", "accountant"]);
  if (!denied) return;
  const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
  res.json(await listTransactions(clientId));
});

app.post("/api/transactions", authenticate, maybeUpload, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager", "employee"]);
  if (!denied) return;
  try {
    const result = createTransactionPayloadSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    const files = ((req as Request & { files?: Express.Multer.File[] }).files ?? []) as Express.Multer.File[];
    const documentAttachments: DocumentAttachment[] = files.map((f) => ({
      path: publicPathForUploadedFile(f.filename),
      originalName: f.originalname,
    }));
    const data = {
      ...result.data,
      originCountry: result.data.originCountry.toUpperCase(),
      documentAttachments: documentAttachments.length ? documentAttachments : undefined,
    };
    return res.status(201).json(await createTransaction(data));
  } catch (e) {
    console.error("POST /api/transactions", e);
    const message = e instanceof Error ? e.message : "Transaction create failed";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/transactions/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager", "employee", "accountant"]);
  if (!denied) return;
  const tx = await getTransaction(req.params.id);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });
  return res.json(tx);
});

app.post("/api/transactions/:id/original-bl", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager", "employee"]);
  if (!denied) return;
  const tx = await markOriginalBl(req.params.id);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });
  return res.json(tx);
});

app.post("/api/transactions/:id/pay", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager", "accountant"]);
  if (!denied) return;
  const tx = await markPaid(req.params.id);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });
  return res.json(tx);
});

app.post("/api/transactions/:id/release", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager", "accountant"]);
  if (!denied) return;
  const result = await issueRelease(req.params.id);
  if (result === null) return res.status(404).json({ error: "Transaction not found" });
  if (result === false) return res.status(400).json({ error: "Payment and Original BL/Telex are required before release" });
  return res.json(result);
});

app.put("/api/transactions/:id", authenticate, maybeUpload, async (req: AuthRequest, res) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ error: "Unauthorized" });

  try {
    const body = req.body as Record<string, unknown>;
    const existingRaw = body.existingAttachments;
    const bodyForZod = { ...body };
    delete bodyForZod.existingAttachments;

    const result = updateTransactionPayloadSchema.safeParse(bodyForZod);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }

    if (role === "employee" && result.data.paymentStatus !== undefined) {
      return res.status(403).json({ error: "Employee cannot manage accounting fields" });
    }

    if (role === "accountant") {
      const nonAccountingFieldProvided = Object.keys(result.data).some((key) => key !== "paymentStatus");
      if (nonAccountingFieldProvided) {
        return res.status(403).json({ error: "Accountant can only update paymentStatus via edit endpoint" });
      }
    }

    const hasMultipart = (req.headers["content-type"] || "").includes("multipart/form-data");

    let payload: Parameters<typeof updateTransaction>[1] = {
      ...result.data,
      originCountry: result.data.originCountry ? result.data.originCountry.toUpperCase() : undefined,
    };

    if (hasMultipart) {
      const prev = await getTransaction(req.params.id);
      if (!prev) return res.status(404).json({ error: "Transaction not found" });
      const files = ((req as Request & { files?: Express.Multer.File[] }).files ?? []) as Express.Multer.File[];
      const uploaded: DocumentAttachment[] = files.map((f) => ({
        path: publicPathForUploadedFile(f.filename),
        originalName: f.originalname,
      }));
      const retained = parseExistingAttachmentsJson(existingRaw);
      const merged = [...retained, ...uploaded];
      await removeOrphanFiles(prev.documentAttachments, merged);
      payload = { ...payload, documentAttachments: merged };
    }

    const tx = await updateTransaction(req.params.id, payload);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    return res.json(tx);
  } catch (e) {
    console.error("PUT /api/transactions/:id", e);
    const message = e instanceof Error ? e.message : "Transaction update failed";
    return res.status(500).json({ error: message });
  }
});

app.delete("/api/transactions/:id", authenticate, async (req: AuthRequest, res) => {
  const denied = ensureRole(req, res, ["manager", "employee"]);
  if (!denied) return;
  const ok = await deleteTransaction(req.params.id);
  if (!ok) return res.status(404).json({ error: "Transaction not found" });
  return res.status(204).send();
});

function isMulterError(err: unknown): err is multer.MulterError {
  return typeof err === "object" && err !== null && "code" in err && typeof (err as { code: unknown }).code === "string";
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isMulterError(err)) {
    return res.status(400).json({
      error: `Upload error (${err.code}): ${err.message}${err.field ? ` — field: ${err.field}` : ""}`,
    });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return res.status(500).json({ error: message });
});

const port = Number(process.env.PORT ?? 4000);
connectDb()
  .then(async () => {
    const defaults = [
      { name: "Main Manager", email: "manager@tracker.local", password: "123456", role: "manager" as const },
      { name: "Operations Employee", email: "employee@tracker.local", password: "123456", role: "employee" as const },
      { name: "Finance Accountant", email: "accountant@tracker.local", password: "123456", role: "accountant" as const },
    ];
    for (const item of defaults) {
      await EmployeeModel.updateOne({ email: item.email }, { $setOnInsert: item }, { upsert: true });
    }
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect database", error);
    process.exit(1);
  });
