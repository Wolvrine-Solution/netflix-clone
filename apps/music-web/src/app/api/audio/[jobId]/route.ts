import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUploadPath } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = await db.processingJob.findUnique({
    where: { id: params.jobId },
    select: { fileKey: true, sourceUrl: true },
  });

  if (!job?.fileKey) {
    return NextResponse.json({ error: "No audio file" }, { status: 404 });
  }

  try {
    const filePath = resolveUploadPath(job.fileKey);
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(job.fileKey).toLowerCase();

    const mimeMap: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".flac": "audio/flac",
      ".m4a": "audio/mp4",
      ".ogg": "audio/ogg",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeMap[ext] ?? "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio not available" }, { status: 404 });
  }
}
