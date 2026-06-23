import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let done = false;
      while (!done) {
        const job = await db.processingJob.findUnique({
          where: { id: params.jobId },
          select: { status: true, progress: true, error: true },
        });

        if (!job) {
          send({ status: "not_found" });
          break;
        }

        send({
          status: job.status,
          progress: job.progress,
          error: job.error,
        });

        if (job.status === "completed" || job.status === "failed") {
          done = true;
        } else {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
