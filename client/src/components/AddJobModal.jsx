import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

const DRAFT_KEY = "seevv_add_job_draft";

const jobSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  jobDescription: z
    .string()
    .min(50, "Please provide the full job description (min 50 characters)"),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

const loadDraft = () => {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveDraft = (values) => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {}
};

const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
};

// ── Text extraction helpers ──────────────────────────────────────────────────

const extractPDFText = async (arrayBuffer) => {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = [];
    let currentLine = [];
    let lastY = null;
    for (const item of content.items) {
      const y = item.transform?.[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(" "));
          currentLine = [];
        }
      }
      if (item.str.trim()) currentLine.push(item.str);
      lastY = y;
    }
    if (currentLine.length > 0) lines.push(currentLine.join(" "));
    fullText += lines.join("\n") + "\n";
  }
  return fullText;
};

const extractDOCXText = async (arrayBuffer) => {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const cleanText = (text) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const extractTextFromFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf") return cleanText(await extractPDFText(arrayBuffer));
  if (ext === "docx" || ext === "doc") return cleanText(await extractDOCXText(arrayBuffer));
  if (ext === "txt") return cleanText(new TextDecoder("utf-8").decode(arrayBuffer));
  throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
};

// ── Tab button ───────────────────────────────────────────────────────────────

const TabBtn = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
      active
        ? "bg-brand-600 text-white"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

// ── Main component ───────────────────────────────────────────────────────────

const AddJobModal = ({
  isOpen,
  onClose,
  onSuccess = () => {},
  onOptimisticAdd = () => {},
}) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const draft = loadDraft();
  const [workType, setWorkType] = useState(draft.workType || "hybrid");
  const [priority, setPriority] = useState(draft.priority || "medium");
  const [jdMode, setJdMode] = useState("paste"); // paste | upload | url
  const [isExtracting, setIsExtracting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fetchUrl, setFetchUrl] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(jobSchema),
    shouldUnregister: false,
    defaultValues: {
      jobTitle: draft.jobTitle || "",
      companyName: draft.companyName || "",
      jobDescription: draft.jobDescription || "",
      location: draft.location || "",
      salaryRange: draft.salaryRange || "",
      jobUrl: draft.jobUrl || "",
    },
  });

  const watchedValues = watch();
  useEffect(() => {
    saveDraft({ ...watchedValues, workType, priority });
  }, [watchedValues, workType, priority]);

  const clearForm = () => {
    reset({
      jobTitle: "",
      companyName: "",
      jobDescription: "",
      location: "",
      salaryRange: "",
      jobUrl: "",
    });
    setWorkType("hybrid");
    setPriority("medium");
    setFetchUrl("");
    clearDraft();
  };

  // ── Smart fill: parse JD text → populate all form fields ─────────────────

  const smartFillFields = useCallback(
    async (text) => {
      setIsParsing(true);
      try {
        const fields = await api.post("/jobs/parse-jd", { text });
        if (fields.jobTitle) setValue("jobTitle", fields.jobTitle, { shouldDirty: true });
        if (fields.companyName) setValue("companyName", fields.companyName, { shouldDirty: true });
        if (fields.location) setValue("location", fields.location, { shouldDirty: true });
        if (fields.salaryRange) setValue("salaryRange", fields.salaryRange, { shouldDirty: true });
        if (fields.workType && ["remote", "hybrid", "onsite"].includes(fields.workType)) {
          setWorkType(fields.workType);
        }
        toast.success("Fields filled from job description");
      } catch {
        // Non-blocking — user can fill manually if AI parse fails
      } finally {
        setIsParsing(false);
      }
    },
    [setValue, toast],
  );

  // ── File drop handler ──────────────────────────────────────────────────────

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setIsExtracting(true);
      try {
        const text = await extractTextFromFile(file);
        setValue("jobDescription", text, { shouldValidate: true, shouldDirty: true });
        setJdMode("paste");
        toast.success(`Text extracted from ${file.name} — filling fields…`);
        await smartFillFields(text);
      } catch (err) {
        toast.error(err.message || "Could not read the file");
      } finally {
        setIsExtracting(false);
      }
    },
    [setValue, toast],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isExtracting,
  });

  // ── URL fetch handler ──────────────────────────────────────────────────────

  const handleFetchUrl = async () => {
    const urlToFetch = fetchUrl.trim() || watchedValues.jobUrl?.trim();
    if (!urlToFetch) {
      toast.error("Enter a URL to fetch");
      return;
    }
    setIsExtracting(true);
    try {
      const data = await api.post("/jobs/fetch-jd", { url: urlToFetch });
      setValue("jobDescription", data.text, { shouldValidate: true, shouldDirty: true });
      setJdMode("paste");
      toast.success("Page fetched — filling fields…");
      await smartFillFields(data.text);
    } catch (err) {
      toast.error(err.message || "Could not fetch the page");
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    try {
      const jobData = {
        user_id: user.id,
        job_title: data.jobTitle,
        company_name: data.companyName,
        job_description: data.jobDescription,
        location: data.location || null,
        salary_range: data.salaryRange || null,
        job_url: data.jobUrl || null,
        work_type: workType,
        priority,
        status: "saved",
      };

      onClose();
      onOptimisticAdd(jobData);
      toast.success(`✓ ${data.jobTitle} at ${data.companyName} added!`);
      clearForm();

      const { error } = await supabase.from("job_targets").insert(jobData);
      if (error) throw error;

      onSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to add job target");
      onSuccess();
    }
  };

  const handleClose = () => {
    const values = watch();
    const hasData = values.jobTitle || values.companyName || values.jobDescription;
    if (hasData) {
      const confirmed = window.confirm(
        "You have unsaved changes. Close anyway? Your draft will be saved.",
      );
      if (!confirmed) return;
    }
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />

      <div className="flex min-h-full items-start sm:items-center justify-center p-4">
        <div
          className={`
            relative w-full max-w-2xl bg-white rounded-2xl shadow-modal
            transform transition-all duration-200 my-4
            max-h-[90vh] flex flex-col
            ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Add job target</h3>
              {Object.values(loadDraft()).some(Boolean) && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Draft restored — your progress was saved
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(watchedValues.jobTitle || watchedValues.companyName || watchedValues.jobDescription) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear all fields?")) clearForm();
                  }}
                  className="text-xs text-gray-400 hover:text-coral-600 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-gray-50"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Job title"
                  placeholder="Product Designer"
                  error={errors.jobTitle?.message}
                  {...register("jobTitle")}
                />
                <Input
                  label="Company name"
                  placeholder="Stripe"
                  error={errors.companyName?.message}
                  {...register("companyName")}
                />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Location (optional)"
                  placeholder="London, UK"
                  error={errors.location?.message}
                  {...register("location")}
                />
                <Input
                  label="Salary range (optional)"
                  placeholder="£60k–£80k"
                  error={errors.salaryRange?.message}
                  {...register("salaryRange")}
                />
              </div>

              {/* Work type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Work type
                </label>
                <div className="flex gap-2">
                  {["remote", "hybrid", "onsite"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setWorkType(type)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer capitalize ${
                        workType === type
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority
                </label>
                <div className="flex gap-2">
                  {["dream", "high", "medium", "low"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer capitalize ${
                        priority === p
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job URL */}
              <Input
                label="Job URL (optional)"
                placeholder="https://stripe.com/jobs/..."
                error={errors.jobUrl?.message}
                {...register("jobUrl")}
              />

              {/* Job description — tabbed input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Job description
                  </label>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <TabBtn active={jdMode === "paste"} onClick={() => setJdMode("paste")}>
                      Paste
                    </TabBtn>
                    <TabBtn active={jdMode === "upload"} onClick={() => setJdMode("upload")}>
                      Upload file
                    </TabBtn>
                    <TabBtn active={jdMode === "url"} onClick={() => setJdMode("url")}>
                      Fetch from URL
                    </TabBtn>
                  </div>
                </div>

                {/* Paste tab */}
                {jdMode === "paste" && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Paste the full job description here — the more detail, the better the AI analysis..."
                      rows={6}
                      className={`
                        w-full px-3 py-2.5 text-sm rounded-lg border transition-colors resize-none
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                        ${errors.jobDescription ? "border-coral-400" : "border-gray-200 hover:border-gray-300"}
                      `}
                      {...register("jobDescription")}
                    />
                    {watchedValues.jobDescription?.length >= 50 && (
                      <button
                        type="button"
                        onClick={() => smartFillFields(watchedValues.jobDescription)}
                        disabled={isParsing}
                        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        {isParsing ? (
                          <>
                            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Filling fields…
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                            </svg>
                            Auto-fill fields from this description
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Upload tab */}
                {jdMode === "upload" && (
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                      transition-all duration-150
                      ${isDragActive && !isDragReject ? "border-brand-600 bg-brand-50" : ""}
                      ${isDragReject ? "border-coral-400 bg-coral-50" : ""}
                      ${!isDragActive && !isDragReject ? "border-gray-200 hover:border-brand-400 hover:bg-gray-50" : ""}
                      ${isExtracting ? "pointer-events-none opacity-60" : ""}
                    `}
                  >
                    <input {...getInputProps()} />
                    {isExtracting ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-sm text-gray-600">Extracting text…</p>
                      </div>
                    ) : isDragReject ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium text-coral-700">File type not supported</p>
                        <p className="text-xs text-coral-500">Upload PDF, DOCX, DOC, or TXT</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {isDragActive ? "Drop the file here" : "Drag & drop the JD file here"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            PDF, DOCX, DOC, or TXT — text is extracted and pasted automatically
                          </p>
                        </div>
                        <Button variant="outline" size="sm" type="button">
                          Browse files
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Fetch from URL tab */}
                {jdMode === "url" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={fetchUrl}
                        onChange={(e) => setFetchUrl(e.target.value)}
                        placeholder={
                          watchedValues.jobUrl
                            ? watchedValues.jobUrl
                            : "https://company.com/jobs/role"
                        }
                        className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent placeholder:text-gray-400"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={handleFetchUrl}
                        isLoading={isExtracting}
                      >
                        Fetch
                      </Button>
                    </div>
                    {watchedValues.jobUrl && !fetchUrl && (
                      <p className="text-xs text-gray-400">
                        Leave blank to use the Job URL above, or enter a different URL.
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Works best with direct job listing pages. If blocked, try uploading or pasting instead.
                    </p>
                  </div>
                )}

                {isParsing && jdMode !== "paste" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-brand-600">
                    <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Extracting fields from job description…
                  </div>
                )}

                {errors.jobDescription && (
                  <p className="mt-1.5 text-xs text-coral-600">
                    {errors.jobDescription.message}
                  </p>
                )}

                {/* Preview when JD has content and not in paste mode */}
                {jdMode !== "paste" && watchedValues.jobDescription && (
                  <div className="mt-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs font-medium text-green-700 mb-1">
                      Job description ready ({watchedValues.jobDescription.length.toLocaleString()} chars)
                    </p>
                    <p className="text-xs text-green-600 line-clamp-2">
                      {watchedValues.jobDescription.slice(0, 120)}…
                    </p>
                    <button
                      type="button"
                      onClick={() => setJdMode("paste")}
                      className="mt-1 text-xs text-green-700 underline cursor-pointer"
                    >
                      View / edit
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 pb-2">
                <Button variant="outline" fullWidth onClick={handleClose} type="button">
                  Cancel
                </Button>
                <Button variant="primary" fullWidth type="submit" isLoading={isSubmitting}>
                  Add role
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddJobModal;
