from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import os

from services.pipeline import run_pipeline
from services.job_store import update_job_status, get_job

app = FastAPI(title="ChordGen API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("WEB_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    job_id: str
    source_url: Optional[str] = None
    file_key: Optional[str] = None


@app.post("/process")
async def process(req: ProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_pipeline, req.job_id, req.source_url, req.file_key)
    return {"status": "queued", "job_id": req.job_id}


@app.get("/status/{job_id}")
async def status(job_id: str):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@app.get("/health")
async def health():
    return {"status": "ok"}
