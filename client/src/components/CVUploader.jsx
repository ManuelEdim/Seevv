import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadCV } from "@/lib/storage";
import { useAuthStore } from "@/store";
import { Button, Spinner } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Point to the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

// Extract text from PDF using PDF.js
const extractPDFText = async (arrayBuffer) => {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
};

// Extract text from DOCX using mammoth
const extractDOCXText = async (arrayBuffer) => {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

// Extract text from TXT
const extractTXTText = async (arrayBuffer) => {
  return new TextDecoder("utf-8").decode(arrayBuffer);
};

// Clean extracted text
const cleanText = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

// Extract CV text from file based on type
const extractTextFromFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop().toLowerCase();

  let text = "";
  if (ext === "pdf") {
    text = await extractPDFText(arrayBuffer);
  } else if (ext === "docx" || ext === "doc") {
    text = await extractDOCXText(arrayBuffer);
  } else if (ext === "txt") {
    text = await extractTXTText(arrayBuffer);
  } else {
    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
  }

  return cleanText(text);
};

const CVUploader = ({ onUploadSuccess }) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState("idle"); // idle | uploading | parsing | done

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setUploadProgress(0);
      setStage("uploading");

      try {
        // Stage 1 — Upload to Supabase Storage
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 75) {
              clearInterval(progressInterval);
              return 75;
            }
            return prev + 15;
          });
        }, 200);

        const uploadData = await uploadCV(file, user.id);
        clearInterval(progressInterval);
        setUploadProgress(80);

        // Stage 2 — Parse text client-side
        setStage("parsing");
        let rawText = "";
        try {
          rawText = await extractTextFromFile(file);
          console.log("Extracted text length:", rawText.length);
        } catch (parseError) {
          console.warn("Text extraction failed:", parseError.message);
          // Non-blocking — continue without raw text
        }

        setUploadProgress(90);

        // Stage 3 — Save CV record with raw text
        const { data: cvRecord, error } = await supabase
          .from("cvs")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_url: uploadData.path,
            file_type: file.name.split(".").pop().toLowerCase(),
            is_active: true,
            raw_text: rawText || null,
          })
          .select()
          .single();

        if (error) throw error;

        setUploadProgress(100);
        setStage("done");

        console.log("CV saved with raw_text length:", rawText.length);
        toast.success("CV uploaded and parsed! Ready to tailor.");
        onUploadSuccess(cvRecord);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(error.message || "Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setStage("idle");
      }
    },
    [user.id, toast, onUploadSuccess],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "text/plain": [".txt"],
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
      disabled: isUploading,
    });

  const stageLabel = {
    uploading: "Uploading your CV...",
    parsing: "Reading and parsing CV...",
    done: "Done!",
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center
          transition-all duration-150 cursor-pointer
          ${isDragActive && !isDragReject ? "border-brand-600 bg-brand-50" : ""}
          ${isDragReject ? "border-coral-400 bg-coral-50" : ""}
          ${!isDragActive && !isDragReject ? "border-gray-200 hover:border-brand-400 hover:bg-gray-50" : ""}
          ${isUploading ? "pointer-events-none opacity-75" : ""}
        `}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-gray-700">
              {stageLabel[stage] || "Processing..."}
            </p>
            <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{uploadProgress}%</p>
          </div>
        ) : isDragReject ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-coral-50 rounded-full flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D85A30"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-coral-700">
              File type not supported
            </p>
            <p className="text-xs text-coral-500">
              Please upload a PDF, DOCX, or TXT file
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#534AB7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive
                  ? "Drop your CV here"
                  : "Drag and drop your CV here"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                or click to browse — PDF, DOCX, or TXT up to 5MB
              </p>
            </div>
            <Button variant="outline" size="sm" type="button">
              Browse files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVUploader;
