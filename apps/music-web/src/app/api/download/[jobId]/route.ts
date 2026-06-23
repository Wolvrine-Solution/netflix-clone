import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import path from "path";
import fs from "fs/promises";

const FORMATS = ["gp5", "pdf", "txt"] as const;
type Format = (typeof FORMATS)[number];

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const format = (req.nextUrl.searchParams.get("format") ?? "gp5") as Format;

  if (!FORMATS.includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const job = await db.processingJob.findUnique({
    where: { id: params.jobId },
    select: { status: true, outputFiles: true, result: true },
  });

  if (!job || job.status !== "completed") {
    return NextResponse.json({ error: "Job not ready" }, { status: 404 });
  }

  const files = job.outputFiles as Record<string, string>;
  const filePath = files[format];

  if (!filePath) {
    return NextResponse.json(
      { error: `${format} output not available` },
      { status: 404 }
    );
  }

  const buffer = await fs.readFile(filePath);
  const filename = path.basename(filePath);

  const mimeMap: Record<Format, string> = {
    gp5: "application/octet-stream",
    pdf: "application/pdf",
    txt: "text/plain",
  };

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeMap[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
