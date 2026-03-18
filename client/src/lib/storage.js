import { supabase } from "./supabase";

// Upload a CV file
export const uploadCV = async (file, userId) => {
  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a PDF, DOCX, or TXT file.",
    );
  }

  // Validate file size — max 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  // Create a unique filename
  const fileExt = file.name.split(".").pop().toLowerCase();
  const fileName = `${userId}/${Date.now()}-Cv.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("Cvs")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return data;
};

// Get a signed URL for a CV file (temporary access link)
export const getCVUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from("Cvs")
    .createSignedUrl(filePath, 3600); // expires in 1 hour

  if (error) throw error;
  return data.signedUrl;
};

// Delete a CV file
export const deleteCV = async (filePath) => {
  const { error } = await supabase.storage.from("Cvs").remove([filePath]);

  if (error) throw error;
};

// Upload an exported CV (PDF/DOCX output)
export const uploadExport = async (file, userId, fileName) => {
  const filePath = `${userId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("Exports")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return data;
};

// Get a signed URL for an export
export const getExportUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from("Exports")
    .createSignedUrl(filePath, 3600);

  if (error) throw error;
  return data.signedUrl;
};
