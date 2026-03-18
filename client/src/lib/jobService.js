import api from "./api";

export const jobService = {
  // Get all job targets
  getAll: () => api.get("/jobs"),

  // Create a new job target
  create: (jobData) => api.post("/jobs", jobData),

  // Update a job target
  update: (jobId, updates) => api.patch(`/jobs/${jobId}`, updates),

  // Delete a job target
  delete: (jobId) => api.delete(`/jobs/${jobId}`),

  // Trigger Deep Decoder analysis
  decode: (jobId) => api.post(`/jobs/${jobId}/decode`),
};
