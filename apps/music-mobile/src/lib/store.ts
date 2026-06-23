import { create } from "zustand";
import type { SongResult } from "@/types";

interface AppState {
  recentJobs: Array<{ jobId: string; title?: string; artist?: string; timestamp: number }>;
  addRecentJob: (jobId: string, meta: { title?: string; artist?: string }) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  recentJobs: [],
  addRecentJob: (jobId, meta) =>
    set((s) => ({
      recentJobs: [
        { jobId, ...meta, timestamp: Date.now() },
        ...s.recentJobs.filter((j) => j.jobId !== jobId).slice(0, 19),
      ],
    })),
  clearHistory: () => set({ recentJobs: [] }),
}));
