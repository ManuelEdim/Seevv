import api from "./api";

export const decoderService = {
  // Analyze a job description
  analyze: (jobDescription) => api.post("/decoder/analyze", { jobDescription }),
};
