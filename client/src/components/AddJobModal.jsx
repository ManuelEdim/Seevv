import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import { Modal, Button, Input } from "@/components/ui";
import { useToast } from "@/context/ToastContext";

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

const AddJobModal = ({ isOpen, onClose, onSuccess }) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [workType, setWorkType] = useState("hybrid");
  const [priority, setPriority] = useState("medium");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(jobSchema) });

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.from("job_targets").insert({
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
      });

      if (error) throw error;

      toast.success(`${data.jobTitle} at ${data.companyName} added!`);
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to add job target");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add job target"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1 — Job title + Company */}
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

        {/* Row 3 — Work type + Priority */}
        <div className="flex flex-col gap-4">
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

        {/* Actions */}
        <div className="flex gap-3 pt-2">
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
    </Modal>
  );
};

export default AddJobModal;
