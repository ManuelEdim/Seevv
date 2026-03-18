import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useJobStore = create(
  devtools(
    (set, get) => ({
      // State
      jobs: [], // all targeted job roles
      activeJob: null, // job currently being worked on
      decoderResult: null, // latest Deep Decoder analysis
      isDecoding: false,
      error: null,

      // Actions
      setJobs: (jobs) => set({ jobs }),

      setActiveJob: (job) => set({ activeJob: job, decoderResult: null }),

      addJob: (job) =>
        set((state) => ({
          jobs: [...state.jobs, job],
        })),

      updateJob: (jobId, updates) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId ? { ...j, ...updates } : j,
          ),
          activeJob:
            state.activeJob?.id === jobId
              ? { ...state.activeJob, ...updates }
              : state.activeJob,
        })),

      deleteJob: (jobId) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== jobId),
          activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
        })),

      setDecoderResult: (result) => set({ decoderResult: result }),

      setDecoding: (isDecoding) => set({ isDecoding }),

      setError: (error) => set({ error }),

      reset: () =>
        set({
          jobs: [],
          activeJob: null,
          decoderResult: null,
          error: null,
        }),
    }),
    { name: "JobStore" },
  ),
);

export default useJobStore;
