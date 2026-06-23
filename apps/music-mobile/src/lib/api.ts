import axios from "axios";
import * as FileSystem from "expo-file-system";
import type { SongResult } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

export async function submitUrl(url: string): Promise<string> {
  const res = await api.post("/api/process", { url });
  return res.data.jobId;
}

export async function submitFile(fileUri: string, mimeType: string): Promise<string> {
  const filename = fileUri.split("/").pop() ?? "audio.mp3";
  const form = new FormData();
  form.append("file", { uri: fileUri, name: filename, type: mimeType } as any);
  const res = await api.post("/api/process", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.jobId;
}

export async function getStatus(jobId: string) {
  const res = await api.get(`/api/internal/jobs/${jobId}`);
  return res.data;
}

export async function getResults(jobId: string): Promise<SongResult> {
  const res = await api.get(`/api/results/${jobId}`);
  return res.data;
}

export async function downloadFile(
  jobId: string,
  format: "gp5" | "pdf" | "txt",
  destPath: string
): Promise<string> {
  const url = `${API_URL}/api/download/${jobId}?format=${format}`;
  const result = await FileSystem.downloadAsync(url, destPath);
  return result.uri;
}
