import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { runMigrations } from "./migrate";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { apiRouter } from "../apiRoutes";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { ENV } from "./env";
import cors from "cors";
import os from "os";
import path from "path";
import fs from "fs";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run DB migrations before starting the server
  await runMigrations();

  const app = express();
  const server = createServer(app);

  // CORS - allow frontend on different domain
  app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Serve uploaded files
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback (only if auth is configured)
  if (ENV.authEnabled) {
    registerOAuthRoutes(app);
  }

  // Multipart file upload endpoint (streams to S3, avoids base64 memory issues)
  // Chunk size: 8MB per chunk to stay under proxy limits
  const CHUNK_SIZE = 8 * 1024 * 1024;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: CHUNK_SIZE + 1024 * 1024 }, // 8MB + 1MB overhead per chunk
  });
  // In-memory chunk store: uploadId -> { chunks: Buffer[], totalChunks, fileName, mimeType }
  const chunkStore = new Map<string, { chunks: (Buffer | null)[], totalChunks: number, fileName: string, mimeType: string }>();

  // Single-request upload (small files < 8MB)
  const uploadFull = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
  });
  app.post('/api/upload', uploadFull.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file provided' });
      const { fileName, mimeType } = req.body;
      const name = fileName || req.file.originalname || 'upload';
      const mime = mimeType || req.file.mimetype || 'application/octet-stream';
      const key = `detections/${nanoid()}-${name}`;
      const { url } = await storagePut(key, req.file.buffer, mime);
      return res.json({ url, key });
    } catch (err: any) {
      console.error('[Upload] Error:', err);
      return res.status(500).json({ error: err?.message || 'Upload failed' });
    }
  });

  // Chunked upload: POST /api/upload/chunk
  // Body: FormData { file: Blob(chunk), uploadId, chunkIndex, totalChunks, fileName, mimeType }
  app.post('/api/upload/chunk', upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No chunk data' });
      const { uploadId, chunkIndex, totalChunks, fileName, mimeType } = req.body;
      if (!uploadId || chunkIndex === undefined || !totalChunks) {
        return res.status(400).json({ error: 'Missing chunk metadata' });
      }
      const idx = parseInt(chunkIndex);
      const total = parseInt(totalChunks);

      if (!chunkStore.has(uploadId)) {
        chunkStore.set(uploadId, {
          chunks: new Array(total).fill(null),
          totalChunks: total,
          fileName: fileName || 'upload',
          mimeType: mimeType || 'application/octet-stream',
        });
      }
      const entry = chunkStore.get(uploadId)!;
      entry.chunks[idx] = req.file.buffer;

      // Check if all chunks received
      const received = entry.chunks.filter(c => c !== null).length;
      if (received < total) {
        return res.json({ status: 'partial', received, total });
      }

      // All chunks received - assemble and upload to S3
      const combined = Buffer.concat(entry.chunks as Buffer[]);
      chunkStore.delete(uploadId);
      const key = `detections/${nanoid()}-${entry.fileName}`;
      const { url } = await storagePut(key, combined, entry.mimeType);
      return res.json({ status: 'complete', url, key });
    } catch (err: any) {
      console.error('[ChunkUpload] Error:', err);
      return res.status(500).json({ error: err?.message || 'Chunk upload failed' });
    }
  });

  // Public REST API v1
  app.use('/api/v1', apiRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
