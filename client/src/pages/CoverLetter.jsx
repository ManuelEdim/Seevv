import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Badge, Spinner, Card, EmptyState } from "@/components/ui";
import useCoverLetter from "@/hooks/useCoverLetter";
import { useToast } from "@/context/ToastContext";
import { SuccessBanner } from "@/components/ui";
import useSuccessAnimation from "@/hooks/useSuccessAnimation";

// ─── Tone config ──────────────────────────────────────────

const toneConfig = {
  formal: {
    label: "Formal",
    description: "Professional and traditional",
    color: "text-gray-700 bg-gray-100",
    badge: "default",
  },
  conversational: {
    label: "Conversational",
    description: "Warm and approachable",
    color: "text-brand-700 bg-brand-50",
    badge: "brand",
  },
  bold: {
    label: "Bold",
    description: "Confident and direct",
    color: "text-amber-700 bg-amber-50",
    badge: "warning",
  },
};

// ─── Word count badge ─────────────────────────────────────

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

// ─── Saved cover letter card ──────────────────────────────

const CoverLetterCard = ({ letter, onEdit, onDelete, isDeleting }) => {
  const tone = toneConfig[letter.tone] || toneConfig.formal;
  const updatedAt = new Date(letter.updated_at || letter.created_at);
  const dateLabel = updatedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const preview = letter.content?.slice(0, 140).trim();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 hover:border-brand-200 transition-all duration-150 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-brand-700">
              {letter.job_target?.company_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {letter.job_target?.job_title || "Role"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {letter.job_target?.company_name || "Company"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${tone.color}`}
          >
            {tone.label}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            {letter.word_count || 0}w
          </span>
        </div>
      </div>

      {preview && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2 italic">
          "{preview}…"
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-300">{dateLabel}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(letter.id)}
            disabled={isDeleting}
            className="text-xs text-gray-400 hover:text-coral-600 cursor-pointer px-2 py-1 rounded-lg hover:bg-coral-50 transition-colors"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
          <Button variant="primary" size="sm" onClick={() => onEdit(letter)}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────

const CoverLetter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // view: 'list' shows saved letters; 'compose' shows the editor
  const [view, setView] = useState(null); // null = auto-detect after load
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const {
    isAnimating,
    isVisible,
    trigger: triggerSuccess,
  } = useSuccessAnimation(3500);

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
    isLoadingAll,
    hasUnsavedChanges,
    error,
    allCoverLetters,
    setTone,
    handleContentChange,
    generateCoverLetter,
    saveCoverLetter,
    fetchCoverLetter,
    deleteCoverLetter,
    setActiveLetter,
    clearEditor,
  } = useCoverLetter();

  // Determine default view once loading is done
  const resolvedView = view ?? (jobId ? "compose" : "list");
  const activeJobId = jobId || selectedJobId;

  // ── Handlers ───────────────────────────────────────────

  const handleGenerate = () => {
    if (!activeJobId) {
      toast.warning("Please select a job target first.");
      return;
    }
    setIsSaved(false);
    generateCoverLetter(activeJobId, tone, triggerSuccess);
  };

  const handleSave = async () => {
    if (!activeJobId) return;
    try {
      await saveCoverLetter(activeJobId);
      toast.success("Cover letter saved!");
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

  const handleEditLetter = (letter) => {
    setActiveLetter(letter);
    setSelectedJobId(letter.job_target_id);
    setIsSaved(false);
    setView("compose");
  };

  const handleNewLetter = () => {
    clearEditor();
    setSelectedJobId("");
    setIsSaved(false);
    setView("compose");
  };

  const handleDeleteLetter = async (id) => {
    if (!window.confirm("Delete this cover letter? This cannot be undone."))
      return;
    setDeletingId(id);
    try {
      await deleteCoverLetter(id);
      toast.success("Cover letter deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBackToList = () => {
    clearEditor();
    setSelectedJobId("");
    setIsSaved(false);
    setView("list");
  };

  // ── Loading ────────────────────────────────────────────

  if (isLoadingAll && resolvedView === "list") {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────

  if (resolvedView === "list") {
    return (
      <div className="mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Cover Letters
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {allCoverLetters.length > 0
                ? `${allCoverLetters.length} saved letter${allCoverLetters.length !== 1 ? "s" : ""}`
                : "No letters saved yet"}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleNewLetter}>
            + New cover letter
          </Button>
        </div>

        {/* Letters list */}
        {allCoverLetters.length === 0 ? (
          <Card padding="md">
            <div className="text-center py-10">
              {/* Illustration */}
              <div className="mx-auto mb-5 w-24 h-24">
                <svg
                  viewBox="0 0 96 96"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="12"
                    y="8"
                    width="72"
                    height="80"
                    rx="8"
                    fill="#eeedfe"
                  />
                  <rect
                    x="12"
                    y="8"
                    width="72"
                    height="80"
                    rx="8"
                    stroke="#afa9ec"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="24"
                    y="24"
                    width="32"
                    height="5"
                    rx="2.5"
                    fill="#534ab7"
                    opacity="0.7"
                  />
                  <rect
                    x="24"
                    y="36"
                    width="48"
                    height="3.5"
                    rx="1.75"
                    fill="#afa9ec"
                  />
                  <rect
                    x="24"
                    y="44"
                    width="40"
                    height="3.5"
                    rx="1.75"
                    fill="#afa9ec"
                  />
                  <rect
                    x="24"
                    y="52"
                    width="44"
                    height="3.5"
                    rx="1.75"
                    fill="#afa9ec"
                  />
                  <rect
                    x="24"
                    y="64"
                    width="36"
                    height="3.5"
                    rx="1.75"
                    fill="#afa9ec"
                  />
                  <rect
                    x="24"
                    y="72"
                    width="28"
                    height="3.5"
                    rx="1.75"
                    fill="#afa9ec"
                  />
                  <circle cx="72" cy="24" r="14" fill="#534ab7" />
                  <path
                    d="M67 24l3 3 5-6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                No cover letters yet
              </h3>
              <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
                Generate your first tailored cover letter. Seevv uses your CV
                and the job description to write something that gets noticed.
              </p>
              <Button variant="primary" onClick={handleNewLetter}>
                Write my first cover letter
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {allCoverLetters.map((letter) => (
              <CoverLetterCard
                key={letter.id}
                letter={letter}
                onEdit={handleEditLetter}
                onDelete={handleDeleteLetter}
                isDeleting={deletingId === letter.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Compose / editor view ──────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-5">
      {/* Back button */}
      {!jobId && (
        <button
          onClick={handleBackToList}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to cover letters
        </button>
      )}

      {/* Job selector — shown when composing fresh without a URL jobId */}
      {!jobId && !activeJobId && (
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
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
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
      {(job || activeJobId) && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-800">
              {job?.job_title || "Selected role"} at{" "}
              {job?.company_name || "company"}
            </p>
            <p className="text-xs text-brand-600 mt-0.5">
              Cover letter tailored to this specific role and company
            </p>
          </div>
          {!jobId && (
            <button
              onClick={() => {
                setSelectedJobId("");
                handleContentChange("");
              }}
              className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer shrink-0"
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

      {/* Success banner */}
      {content && !isGenerating && !isSaved && (
        <SuccessBanner
          isVisible={isVisible}
          title="Cover letter generated!"
          description={`${wordCount} words · ${toneConfig[tone]?.label} tone · Ready to review and save`}
        />
      )}

      {/* Saved state */}
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

      {/* Editor */}
      {content && !isGenerating && !isSaved && (
        <div className="space-y-4">
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
                onClick={() => toast.info("PDF export coming soon")}
              >
                Export PDF
              </Button>
            </div>
          </div>

          <div
            className={`bg-white rounded-2xl border-2 shadow-card overflow-hidden transition-all duration-300 ${
              isAnimating
                ? "animate-wobble animate-shimmer-border"
                : "border-gray-100"
            }`}
          >
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">
                {job?.job_title || "Role"} at {job?.company_name || "Company"}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${toneConfig[tone]?.color}`}
              >
                {toneConfig[tone]?.label}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full px-8 py-6 text-sm text-gray-800 leading-7 resize-none focus:outline-none min-h-96"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              placeholder="Your cover letter will appear here..."
            />
          </div>

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
              onClick={() => toast.info("PDF export coming soon")}
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
