import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button, EmptyState, Spinner, Card, Badge } from "@/components/ui";
import CVUploader from "@/components/CVUploader";
import CVVersionCard from "@/components/CVVersionCard";
import useCVManager from "@/hooks/useCVManager";
import { useToast } from "@/context/ToastContext";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";

// ─── Version diff modal ────────────────────────────────────────
const CompareModal = ({ versions, ids, onClose }) => {
  const [a, b] = ids.map((id) => versions.find((v) => v.id === id)).filter(Boolean);
  if (!a || !b) return null;

  const linesA = (a.raw_text || "").split("\n");
  const linesB = (b.raw_text || "").split("\n");
  const maxLen = Math.max(linesA.length, linesB.length);
  const rows = Array.from({ length: maxLen }, (_, i) => ({
    la: linesA[i] ?? "",
    lb: linesB[i] ?? "",
    diff: (linesA[i] ?? "") !== (linesB[i] ?? ""),
  }));
  const diffCount = rows.filter((r) => r.diff).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-stretch bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col w-full h-full bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <p className="text-sm font-bold text-gray-900">Version comparison</p>
            <span className="text-xs text-gray-400">{diffCount} line{diffCount !== 1 ? "s" : ""} differ</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Column labels */}
        <div className="grid grid-cols-2 gap-px bg-gray-100 shrink-0">
          {[a, b].map((v, col) => (
            <div key={col} className={`px-6 py-2.5 ${col === 0 ? "bg-red-50" : "bg-teal-50"}`}>
              <p className="text-xs font-semibold text-gray-800 truncate">{v.file_name || (col === 0 ? "Version A" : "Version B")}</p>
              <p className="text-[10px] text-gray-500">{new Date(v.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Diff body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {[
              { lines: linesA, bg: "bg-red-50", textColor: "text-red-700" },
              { lines: linesB, bg: "bg-teal-50", textColor: "text-teal-800" },
            ].map(({ lines, bg, textColor }, col) => (
              <div key={col} className="bg-white overflow-x-auto">
                <div className="text-[11px] leading-5 font-mono">
                  {rows.map((r, i) => (
                    <div key={i} className={`px-4 py-px flex gap-2 ${r.diff ? `${bg} ${textColor}` : "text-gray-700"}`}>
                      <span className="select-none text-gray-300 text-[9px] shrink-0 w-7 text-right">{i + 1}</span>
                      <span className="whitespace-pre-wrap break-all">{(col === 0 ? r.la : r.lb) || " "}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CVManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tailorJobId = searchParams.get("tailor");
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const {
    masterCV,
    cvVersions,
    isLoading,
    error,
    refetch,
    deleteVersion,
    deleteMasterCV,
  } = useCVManager();

  const [showUploader, setShowUploader] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoringTriggered, setTailoringTriggered] = useState(false);
  const [hasVoiceSample, setHasVoiceSample] = useState(null); // null = loading
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  // Check if user has set a voice sample
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("voice_sample")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setHasVoiceSample(!!(data?.voice_sample && data.voice_sample.trim().length > 50));
      })
      .catch(() => {
        setHasVoiceSample(false);
      });
  }, [user?.id]);

  // Auto-trigger tailoring if coming from decoder
  useEffect(() => {
    if (
      tailorJobId &&
      masterCV &&
      !isLoading &&
      !isTailoring &&
      !tailoringTriggered
    ) {
      setTailoringTriggered(true);
      handleTailorCV(tailorJobId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailorJobId, masterCV, isLoading]);

  const handleTailorCV = async (jobId) => {
    if (!masterCV) {
      toast.warning("Please upload your master CV first.");
      return;
    }

    if (!masterCV.raw_text) {
      toast.warning(
        "Your CV hasn't been parsed yet. Please delete it and re-upload.",
      );
      return;
    }

    setIsTailoring(true);
    toast.info("Tailoring your CV — this takes 20-30 seconds...");

    try {
      const response = await api.post("/cv/rewrite", {
        cvId: masterCV.id,
        jobTargetId: jobId,
        tone: "balanced",
      });

      toast.success("CV tailored successfully! Redirecting to editor...");
      refetch();

      // Navigate to the new version editor
      if (response.version?.id) {
        setTimeout(() => navigate(`/cv/${response.version.id}`), 1000);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to tailor CV. Please try again.",
      );
    } finally {
      setIsTailoring(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploader(false);
    refetch();
    toast.success("CV uploaded and parsed! Ready to tailor.");
  };

  const handleDeleteVersion = async (versionId) => {
    const confirmed = window.confirm(
      "Delete this CV version? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteVersion(versionId);
      toast.success("CV version deleted.");
    } catch (error) {
      toast.error(error.message || "Failed to delete version.");
    }
  };

  const handleDeleteMasterCV = async () => {
    const confirmed = window.confirm(
      "Delete your master CV? This will also delete all tailored versions. This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteMasterCV();
      toast.success("Master CV deleted.");
      refetch();
    } catch (error) {
      toast.error(error.message || "Failed to delete CV.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-coral-600">{error}</p>
        <Button variant="outline" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 pb-10">
      {showCompare && compareIds.length === 2 && (
        <CompareModal versions={cvVersions} ids={compareIds} onClose={() => setShowCompare(false)} />
      )}
      {/* ── Voice mirroring nudge ─────────────────────── */}
      {hasVoiceSample === false && !isTailoring && masterCV && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-lg shrink-0">🎤</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800">Voice mirroring is not set</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Add your writing sample so rewrites sound like you — not generic AI.
            </p>
          </div>
          <Link
            to="/profile"
            className="text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 shrink-0"
          >
            Set it up →
          </Link>
        </div>
      )}

      {/* ── Tailoring in progress banner ──────────────── */}
      {isTailoring && (
        <Card padding="md">
          <div className="flex flex-col items-center py-6 gap-4 text-center">
            <Spinner size="lg" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Tailoring your CV with Seevv...
              </p>
              <p className="text-xs text-gray-400">
                {hasVoiceSample
                  ? "Rewriting in your voice for this specific role. This takes 20-30 seconds."
                  : "Rewriting each section for this specific role. This takes 20-30 seconds."}
              </p>
              {hasVoiceSample && (
                <p className="text-xs text-teal-600 mt-1 font-medium">
                  ✓ Voice mirroring active
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── No master CV warning when tailor requested ── */}
      {tailorJobId && !masterCV && !isLoading && (
        <Card padding="md">
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Upload your master CV first
            </p>
            <p className="text-xs text-gray-400 mb-4">
              You need a master CV before Seevv can tailor it for this role.
            </p>
            <Button variant="primary" onClick={() => setShowUploader(true)}>
              Upload CV now
            </Button>
          </div>
        </Card>
      )}

      {/* ── Master CV section ─────────────────────────── */}
      {!isTailoring && (
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Master CV</h2>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Your base CV — all tailored versions are created from this
              </p>
            </div>
            {masterCV && !showUploader && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setShowUploader(true)}
              >
                Replace
              </Button>
            )}
          </div>

          {/* Upload area */}
          {(!masterCV || showUploader) && (
            <div className="mb-4">
              <CVUploader onUploadSuccess={handleUploadSuccess} />
              {showUploader && masterCV && (
                <button
                  onClick={() => setShowUploader(false)}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Cancel — keep current CV
                </button>
              )}
            </div>
          )}

          {/* Current master CV card */}
          {masterCV && !showUploader && (
            <Card padding="md">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate pr-2">
                    {masterCV.file_name}
                  </p>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                    {masterCV.raw_text ? (
                      <Badge variant="info" size="sm">
                        Parsed ✓
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Not parsed
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400 uppercase">
                      {masterCV.file_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(masterCV.created_at).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDeleteMasterCV}
                  className="text-xs text-gray-400 hover:text-coral-600 cursor-pointer transition-colors shrink-0 mt-0.5"
                >
                  Delete
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-50">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => navigate("/decoder")}
                >
                  Decode a job
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => navigate("/dashboard")}
                >
                  View job targets
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tailored versions section ─────────────────── */}
      {!isTailoring && (
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">
                Tailored versions
                {cvVersions.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {cvVersions.length} total
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Each version is tailored for a specific role
              </p>
            </div>
          </div>

          {/* Compare bar */}
          {cvVersions.length >= 2 && (
            <div className="flex items-center gap-3 mb-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
              <p className="text-xs text-gray-500 flex-1">
                {compareIds.length === 0 && "Select 2 versions to compare side by side"}
                {compareIds.length === 1 && "Select 1 more version to compare"}
                {compareIds.length === 2 && "2 versions selected"}
              </p>
              {compareIds.length === 2 && (
                <button
                  onClick={() => setShowCompare(true)}
                  className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors"
                >Compare →</button>
              )}
              {compareIds.length > 0 && (
                <button onClick={() => setCompareIds([])} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Clear</button>
              )}
            </div>
          )}

          {cvVersions.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                }
                title="No tailored versions yet"
                description={
                  masterCV
                    ? "Decode a job target then click 'Tailor my CV' to create your first version."
                    : "Upload your master CV first, then add job targets to start tailoring."
                }
                action={() =>
                  masterCV ? navigate("/decoder") : setShowUploader(true)
                }
                actionLabel={masterCV ? "Go to decoder" : "Upload CV"}
              />
            </Card>
          ) : (
            <div className="grid gap-3">
              {cvVersions.map((version) => (
                <div key={version.id} className="relative">
                  <CVVersionCard
                    version={version}
                    onDelete={handleDeleteVersion}
                  />
                  <button
                    onClick={() => toggleCompare(version.id)}
                    title="Select for comparison"
                    className={`absolute top-3 right-16 text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                      compareIds.includes(version.id)
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-400 border-gray-200 hover:border-brand-300 hover:text-brand-600"
                    }`}
                  >{compareIds.includes(version.id) ? "✓ Comparing" : "Compare"}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CVManager;
