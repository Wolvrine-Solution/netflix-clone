import { notFound } from "next/navigation";
import { ResultsClient } from "@/components/ResultsClient";
import { db } from "@/lib/db";

interface Props {
  params: { jobId: string };
}

export default async function ResultsPage({ params }: Props) {
  const job = await db.processingJob.findUnique({
    where: { id: params.jobId },
  });

  if (!job) notFound();

  return (
    <ResultsClient
      jobId={params.jobId}
      initialStatus={job.status}
      initialData={job.status === "completed" ? (job.result as any) : null}
    />
  );
}
