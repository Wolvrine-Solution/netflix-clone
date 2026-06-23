import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const body = await req.json();

  await db.processingJob.update({
    where: { id: params.jobId },
    data: {
      status: body.status,
      progress: body.progress,
      result: body.result ?? undefined,
      outputFiles: body.outputFiles ?? undefined,
      error: body.error ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = await db.processingJob.findUnique({
    where: { id: params.jobId },
    select: { id: true, status: true, progress: true, error: true },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}
