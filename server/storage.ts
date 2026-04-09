// Local filesystem storage - replaces Manus Forge storage proxy
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Get the public base URL for constructing full URLs that external APIs can access
function getPublicBaseUrl(): string {
  // Use PUBLIC_URL env var, or RAILWAY_PUBLIC_DOMAIN, or fall back to localhost
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOAD_DIR, key);

  // Ensure subdirectory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  if (typeof data === "string") {
    fs.writeFileSync(filePath, data);
  } else {
    fs.writeFileSync(filePath, Buffer.from(data));
  }

  // Return full public URL so external APIs (SightEngine, Illuminarty) can access it
  const url = `${getPublicBaseUrl()}/uploads/${key}`;
  return { key, url };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return {
    key,
    url: `${getPublicBaseUrl()}/uploads/${key}`,
  };
}
