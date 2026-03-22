import api from "./api";

export const decoderService = {
  analyze: (jobDescription, jobTargetId = null) =>
    api.post("/decoder/analyze", { jobDescription, jobTargetId }),
};
