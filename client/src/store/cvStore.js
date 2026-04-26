import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useCVStore = create(
  devtools(
    (set) => ({
      // State
      masterCV: null, // the original uploaded CV
      parsedChunks: [], // structured sections from the parser
      versions: [], // all tailored CV versions
      activeVersion: null, // the version currently being edited
      isUploading: false,
      isParsing: false,
      isRewriting: false,
      error: null,

      // Actions
      setMasterCV: (cv) => set({ masterCV: cv }),

      setParsedChunks: (chunks) => set({ parsedChunks: chunks }),

      setVersions: (versions) => set({ versions }),

      setActiveVersion: (version) => set({ activeVersion: version }),

      addVersion: (version) =>
        set((state) => ({
          versions: [...state.versions, version],
        })),

      updateVersion: (versionId, updates) =>
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId ? { ...v, ...updates } : v,
          ),
          activeVersion:
            state.activeVersion?.id === versionId
              ? { ...state.activeVersion, ...updates }
              : state.activeVersion,
        })),

      deleteVersion: (versionId) =>
        set((state) => ({
          versions: state.versions.filter((v) => v.id !== versionId),
          activeVersion:
            state.activeVersion?.id === versionId ? null : state.activeVersion,
        })),

      setUploading: (isUploading) => set({ isUploading }),
      setParsing: (isParsing) => set({ isParsing }),
      setRewriting: (isRewriting) => set({ isRewriting }),
      setError: (error) => set({ error }),

      reset: () =>
        set({
          masterCV: null,
          parsedChunks: [],
          versions: [],
          activeVersion: null,
          error: null,
        }),
    }),
    { name: "CVStore" },
  ),
);

export default useCVStore;
