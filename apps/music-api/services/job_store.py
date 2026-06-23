"""
Thin async wrapper to update job status in the DB via the Next.js API.
In production this would use a shared Prisma/DB connection or a direct DB write.
For simplicity here we call the internal Next.js API.
"""
import os
import httpx
from typing import Any

WEB_URL = os.getenv("WEB_URL", "http://localhost:3000")


async def update_job_status(
    job_id: str,
    status: str,
    progress: int,
    result: Any = None,
    output_files: Any = None,
    error: str | None = None,
) -> None:
    payload: dict[str, Any] = {
        "status": status,
        "progress": progress,
    }
    if result is not None:
        payload["result"] = result
    if output_files is not None:
        payload["outputFiles"] = output_files
    if error is not None:
        payload["error"] = error

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.patch(
                f"{WEB_URL}/api/internal/jobs/{job_id}",
                json=payload,
            )
        except Exception:
            pass


async def get_job(job_id: str) -> dict | None:
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            res = await client.get(f"{WEB_URL}/api/internal/jobs/{job_id}")
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass
    return None
