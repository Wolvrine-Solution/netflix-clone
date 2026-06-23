import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const LOCAL_PATH = process.env.STORAGE_LOCAL_PATH ?? "./tmp/audio";

export async function saveUpload(file: File): Promise<string> {
  await fs.mkdir(LOCAL_PATH, { recursive: true });
  const ext = file.name.split(".").pop() ?? "bin";
  const key = `${randomUUID()}.${ext}`;
  const dest = path.join(LOCAL_PATH, key);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
  return key;
}

export function resolveUploadPath(key: string): string {
  return path.join(LOCAL_PATH, key);
}
