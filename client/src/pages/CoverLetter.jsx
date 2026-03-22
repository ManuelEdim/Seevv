import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Badge, Spinner, Card, EmptyState } from "@/components/ui";
import useCoverLetter from "@/hooks/useCoverLetter";
import { useToast } from "@/context/ToastContext";

const toneConfig = {
  formal: {
    label: "Formal",
    description: "Professional and traditional",
    color: "text-gray-700 bg-gray-100",
  },
  conversational: {
    label: "Conversational",
    description: "Warm and approachable",
    color: "text-brand-700 bg-brand-50",
  },
  bold: {
    label: "Bold",
    description: "Confident and direct",
    color: "text-amber-700 bg-amber-50",
  },
};

const WordCountBadge = ({ count }) => {
  const color = count < 200 ? "warning" : count <= 400 ? "success" : "danger";
  const label =
    count < 200 ? "Too short" : count <= 400 ? "Good length" : "Too long";

  return (
    <div className="flex items-center gap-2">
      <Badge variant={color} size="sm">
        {label}
      </Badge>
      <span className="text-xs text-gray-400">{count} words</span>
    </div>
  );
};

const CoverLetter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const {
    job,
    jobs,
    jobId,
    content,
    tone,
    wordCount,
    isGenerating,
    isSaving,
    isLoading,
    hasUnsavedChanges,
    error,
    setTone,
    handleContentChange,
    generateCoverLetter,
    saveCoverLetter,
    fetchCoverLetter,
  } = useCoverLetter();

  const activeJobId = jobId || selectedJobId;

  const handleGenerate = () => {
    if (!activeJobId) {
      toast.warning("Please select a job target first.");
      return;
    }
    // Reset saved state when regenerating
    setIsSaved(false);
    generateCoverLetter(activeJobId, tone);
  };

  const handleSave = async () => {
    if (!activeJobId) return;
    try {
      await saveCoverLetter(activeJobId);
      toast.success("Cover letter saved successfully!");
      setIsSaved(true);
    } catch (err) {
      toast.error(err.message || "Failed to save.");
    }
  };

  const handleJobSelect = (id) => {
    setSelectedJobId(id);
    setIsSaved(false);
    fetchCoverLetter(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Job selector — shown if not coming from a specific job */}
      {!jobId && (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Select a job target
          </h2>
          {jobs.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              }
              title="No job targets yet"
              description="Add a job target from the dashboard first."
              action={() => navigate("/dashboard")}
              actionLabel="Go to dashboard"
            />
          ) : (
            <div className="grid gap-2">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => handleJobSelect(j.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedJobId === j.id
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-700">
                      {j.company_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {j.job_title}
                    </p>
                    <p className="text-xs text-gray-400">{j.company_name}</p>
                  </div>
                  {selectedJobId === j.id && (
                    <span className="ml-auto text-xs text-brand-600 font-medium">
                      Selected ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Job context banner */}
      {(job || selectedJobId) && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-800">
              {job?.job_title || "Selected role"} at{" "}
              {job?.company_name || "company"}
            </p>
            <p className="text-xs text-brand-600 mt-0.5">
              Cover letter will be tailored to this specific role and company
            </p>
          </div>
          {!jobId && (
            <button
              onClick={() => {
                setSelectedJobId("");
                setIsSaved(false);
                handleContentChange("");
              }}
              className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer flex-shrink-0"
            >
              Change
            </button>
          )}
        </div>
      )}

      {/* Tone selector */}
      {activeJobId && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tone</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(toneConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setTone(key)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  tone === key
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit mb-1 ${config.color}`}
                >
                  {config.label}
                </p>
                <p className="text-xs text-gray-400">{config.description}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Generate button — shown when no content yet */}
      {activeJobId && !content && !isGenerating && (
        <Card padding="md">
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Ready to generate
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Seevv will write a tailored cover letter based on the job
              description and your CV.
            </p>
            <Button variant="primary" onClick={handleGenerate}>
              Generate cover letter
            </Button>
          </div>
        </Card>
      )}

      {/* Generating state */}
      {isGenerating && (
        <Card padding="md">
          <div className="flex flex-col items-center py-8 gap-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Writing your cover letter...
              </p>
              <p className="text-xs text-gray-400">
                Analysing the job description and tailoring to your experience
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Saved state — shown after saving, content still accessible */}
      {isSaved && content && !isGenerating && (
        <Card padding="md">
          <div className="flex flex-col items-center py-6 gap-4 text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1D9E75"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Cover letter saved
              </p>
              <p className="text-xs text-gray-400">
                {job?.job_title} at {job?.company_name} · {wordCount} words ·{" "}
                {toneConfig[tone]?.label}
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => setIsSaved(false)}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                fullWidth
                size="sm"
                onClick={handleGenerate}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Editor — shown when content exists, not saved, not generating */}
      {content && !isGenerating && !isSaved && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <WordCountBadge count={wordCount} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                isLoading={isGenerating}
              >
                Regenerate
              </Button>
              {hasUnsavedChanges && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Save
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("PDF export coming in Phase 5")}
              >
                Export PDF
              </Button>
            </div>
          </div>

          {/* Editable content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">
                Cover letter — {job?.job_title || "Role"} at{" "}
                {job?.company_name || "Company"}
              </p>
              <Badge
                variant="default"
                size="sm"
                className={toneConfig[tone]?.color}
              >
                {toneConfig[tone]?.label}
              </Badge>
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full px-8 py-6 text-sm text-gray-800 leading-7 resize-none focus:outline-none min-h-96"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              placeholder="Your cover letter will appear here..."
            />
          </div>

          {/* Bottom actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save cover letter
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => toast.info("PDF export coming in Phase 5")}
            >
              Export as PDF
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card padding="md">
          <p className="text-sm text-coral-600 text-center">{error}</p>
        </Card>
      )}
    </div>
  );
};

export default CoverLetter;
