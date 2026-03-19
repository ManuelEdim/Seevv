import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/ToastContext";

const DRAFT_KEY = "seevv_add_job_draft";

const jobSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  jobDescription: z
    .string()
    .min(50, "Please paste the full job description (min 50 characters)"),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  jobUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

// Load saved draft from sessionStorage
const loadDraft = () => {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Save draft to sessionStorage
const saveDraft = (values) => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // sessionStorage not available — fail silently
  }
};

// Clear draft from sessionStorage
const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // fail silently
  }
};

const AddJobModal = ({
  isOpen,
  onClose,
  onSuccess = () => {},
  onOptimisticAdd = () => {},
}) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  // Restore work type and priority from draft too
  const draft = loadDraft();
  const [workType, setWorkType] = useState(draft.workType || "hybrid");
  const [priority, setPriority] = useState(draft.priority || "medium");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(jobSchema),
    shouldUnregister: false,
    // Pre-fill form with any saved draft
    defaultValues: {
      jobTitle: draft.jobTitle || "",
      companyName: draft.companyName || "",
      jobDescription: draft.jobDescription || "",
      location: draft.location || "",
      salaryRange: draft.salaryRange || "",
      jobUrl: draft.jobUrl || "",
    },
  });

  // Watch all fields and save to sessionStorage on every change
  const watchedValues = watch();
  useEffect(() => {
    saveDraft({
      ...watchedValues,
      workType,
      priority,
    });
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
    clearDraft();
  };

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

      // Clear draft and form after successful submit
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
    const hasData =
      values.jobTitle || values.companyName || values.jobDescription;

    if (hasData) {
      const confirmed = window.confirm(
        "You have unsaved changes. Close anyway? Your draft will be saved.",
      );
      if (!confirmed) return;
    }

    onClose();
    // Don't clear draft on close — restore it next time they open
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal panel */}
      {/* Modal panel */}
      <div className="flex min-h-full items-start sm:items-center justify-center p-4">
        <div
          className={`
      relative w-full max-w-2xl bg-white rounded-2xl shadow-modal
      transform transition-all duration-200 my-4
      max-h-[90vh] flex flex-col
      ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
    `}
        >
          {/* Header — fixed, never scrolls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Add job target
              </h3>
              {Object.values(loadDraft()).some(Boolean) && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Draft restored — your progress was saved
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Scrollable form body */}
          <div className="px-6 py-5 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Row 1 — Job title + Company */}
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

              {/* Row 2 — Location + Salary */}
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

              {/* Job description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job description
                </label>
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
                {errors.jobDescription && (
                  <p className="mt-1.5 text-xs text-coral-600">
                    {errors.jobDescription.message}
                  </p>
                )}
              </div>

              {/* Actions — inside scroll area so they're always reachable */}
              <div className="flex gap-3 pt-2 pb-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleClose}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  type="submit"
                  isLoading={isSubmitting}
                >
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
