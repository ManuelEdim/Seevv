import api from "./api";

export const cvService = {
  // Get all CVs for the current user
  getAll: () => api.get("/cv"),

  // Upload a new CV file
  upload: (file) => {
    const formData = new FormData();
    formData.append("cv", file);

    return api.post("/cv/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Trigger parsing of an uploaded CV
  parse: (cvId) => api.post(`/cv/${cvId}/parse`),

  // Delete a CV
  delete: (cvId) => api.delete(`/cv/${cvId}`),
};
