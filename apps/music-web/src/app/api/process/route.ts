import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createJob } from "@/lib/queue";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const urlSchema = z.object({
  url: z.string().url(),
});

const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/mp4",
  "audio/ogg",
  "video/mp4",
]);

const MAX_BYTES = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? "50") * 1024 * 1024;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(ip);
  if (limited) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let sourceUrl: string | null = null;
  let fileKey: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });
    }

    // Save to temp storage and get a key
    const { saveUpload } = await import("@/lib/storage");
    fileKey = await saveUpload(file);
  } else {
    const body = await req.json();
    const parsed = urlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    sourceUrl = parsed.data.url;
  }

  const job = await db.processingJob.create({
    data: {
      status: "queued",
      sourceUrl,
      fileKey,
    },
  });

  await createJob({ jobId: job.id, sourceUrl, fileKey });

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
