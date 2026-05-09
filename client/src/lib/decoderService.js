import api from "./api";

export const decoderService = {
  analyze: (jobDescription, jobTargetId = null, signal = null) =>
    api.post("/decoder/analyze", { jobDescription, jobTargetId }, { signal }),
};
