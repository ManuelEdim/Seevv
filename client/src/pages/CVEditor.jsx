import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Badge, Spinner, Card } from "@/components/ui";
import useCVEditor from "@/hooks/useCVEditor";
import { useToast } from "@/context/ToastContext";

// ─── Bullet item with accept/reject ──────────────────────

const BulletItem = ({
  original,
  tailored,
  onAccept,
  onReject,
  accepted,
  rewriteLevel,
  autoAccepted,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const noChange = original === tailored || rewriteLevel === "none";

  if (autoAccepted && noChange) {
    return (
      <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
        <p className="text-sm text-gray-800 leading-relaxed">{tailored}</p>
        <span className="mt-1.5 inline-block text-xs text-teal-600 font-medium">
          ✓ Strong match — kept as is
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-150 ${
        accepted === true
          ? "border-teal-400 bg-teal-50"
          : accepted === false
            ? "border-gray-200 bg-gray-50 opacity-60"
            : "border-brand-200 bg-brand-50"
      }`}
    >
      <p
        className={`text-sm leading-relaxed ${
          accepted === false ? "line-through text-gray-400" : "text-gray-800"
        }`}
      >
        {tailored}
      </p>

      {original && original !== tailored && (
        <button
          onClick={() => setShowOriginal((p) => !p)}
          className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          {showOriginal ? "Hide original" : "Show original"}
        </button>
      )}

      {showOriginal && (
        <p className="mt-2 text-xs text-gray-400 italic border-t border-gray-200 pt-2">
          Original: {original}
        </p>
      )}

      {accepted === undefined && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onAccept}
            className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 cursor-pointer transition-colors"
          >
            ✓ Accept
          </button>
          <button
            onClick={onReject}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {accepted === true && (
        <span className="mt-2 inline-block text-xs text-teal-600 font-medium">
          ✓ Accepted
        </span>
      )}

      {accepted === false && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">
            Rejected — original will be used
          </span>
          <button
            onClick={onAccept}
            className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Section panel ────────────────────────────────────────

const rewriteLabelConfig = {
  none: { label: "No changes needed", color: "text-teal-600" },
  bullet: { label: "Bullets refined", color: "text-amber-600" },
  full: { label: "Fully rewritten", color: "text-brand-600" },
};

const CVSection = ({ title, bullets, rewriteLevel }) => {
  const [bulletStates, setBulletStates] = useState(
    bullets.map((b) => (b.autoAccepted ? true : undefined)),
  );

  const handleAccept = (i) => {
    setBulletStates((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  const handleReject = (i) => {
    setBulletStates((prev) => {
      const next = [...prev];
      next[i] = false;
      return next;
    });
  };

  const acceptedCount = bulletStates.filter((s) => s === true).length;
  const pendingCount = bulletStates.filter((s) => s === undefined).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {title}
          </h3>
          {rewriteLevel && rewriteLabelConfig[rewriteLevel] && (
            <span
              className={`text-xs ${rewriteLabelConfig[rewriteLevel].color}`}
            >
              · {rewriteLabelConfig[rewriteLevel].label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs text-amber-600">
              {pendingCount} pending
            </span>
          )}
          {acceptedCount > 0 && (
            <span className="text-xs text-teal-600">
              {acceptedCount} accepted
            </span>
          )}
          {pendingCount > 0 && (
            <button
              onClick={() => setBulletStates(bullets.map(() => true))}
              className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer font-medium"
            >
              Accept all
            </button>
          )}
        </div>
      </div>

      {/* Bullets */}
      <div className="p-4 space-y-3">
        {bullets.map((bullet, i) => (
          <BulletItem
            key={i}
            original={bullet.original}
            tailored={bullet.tailored}
            accepted={bulletStates[i]}
            rewriteLevel={bullet.rewriteLevel}
            autoAccepted={bullet.autoAccepted}
            onAccept={() => handleAccept(i)}
            onReject={() => handleReject(i)}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Mock content for placeholder display ────────────────

const getMockSections = (jobTitle) => [
  {
    title: "Professional summary",
    rewriteLevel: "full",
    bullets: [
      {
        original: "Experienced product designer with 7 years in the field.",
        tailored: `Product designer with 7 years shaping digital products from 0→1 and at scale. Led end-to-end design across ${jobTitle || "complex product areas"} — driving decisions that reduced drop-off by 34%. High craft bar; comfortable in ambiguity.`,
        autoAccepted: false,
        rewriteLevel: "full",
      },
    ],
  },
  {
    title: "Work experience",
    rewriteLevel: "bullet",
    bullets: [
      {
        original: "Responsible for design of the main product.",
        tailored:
          "Owned end-to-end design of the core product — from research to shipped features — resulting in a 28% improvement in task completion rate.",
        autoAccepted: false,
        rewriteLevel: "bullet",
      },
      {
        original: "Worked with engineers and product managers.",
        tailored:
          "Partnered directly with engineering and PM to define scope, resolve design ambiguity, and ship features on a 2-week sprint cadence.",
        autoAccepted: false,
        rewriteLevel: "bullet",
      },
      {
        original: "Created design system components.",
        tailored:
          "Led the evolution of the component library from 40 to 180+ components, reducing design-to-dev handoff time by 60%.",
        autoAccepted: false,
        rewriteLevel: "bullet",
      },
    ],
  },
  {
    title: "Skills",
    rewriteLevel: "none",
    bullets: [
      {
        original: "Figma, Sketch, user research",
        tailored:
          "Figma (expert), user research, prototyping, design systems, cross-functional collaboration, data-informed design",
        autoAccepted: true,
        rewriteLevel: "none",
      },
    ],
  },
];

// ─── Extract real sections from AI-generated tailored content ──

const getRealSections = (tailoredContent) => {
  if (!tailoredContent) return [];
  const sections = [];

  const sectionConfig = {
    summary: "Professional summary",
    experience: "Work experience",
    skills: "Skills",
    achievements: "Achievements",
    projects: "Projects",
  };

  for (const [key, label] of Object.entries(sectionConfig)) {
    const section = tailoredContent[key];

    // Skip if section doesn't exist or has no content at all
    if (!section) continue;
    if (typeof section !== "object") continue;

    const rewriteLevel = section.rewrite_level || "full";
    const autoAccepted = section.accepted === true;

    // Get the tailored text — try multiple possible fields
    const tailoredText = section.tailored || section.text || "";
    const originalText = section.original || section.text || tailoredText;

    if (!tailoredText || tailoredText.trim().length < 10) continue;

    // Try bullet-level data first
    const hasBullets =
      Array.isArray(section.bullets_tailored) &&
      section.bullets_tailored.length > 0 &&
      section.bullets_tailored.some((b) => b && b.trim().length > 5);

    if (hasBullets) {
      const bullets = section.bullets_tailored
        .filter((b) => b && b.trim().length > 5)
        .map((tailored, i) => ({
          original: section.bullets_original?.[i] || tailored,
          tailored: tailored.trim(),
          autoAccepted,
          rewriteLevel,
        }));

      if (bullets.length > 0) {
        sections.push({ title: label, bullets, rewriteLevel });
      }
      continue;
    }

    // Fall back to splitting full text into lines
    const tailoredLines = tailoredText
      .split("\n")
      .map((l) => l.replace(/^[-•·▪►*]\s*/, "").trim())
      .filter((l) => l.length > 15);

    const originalLines = originalText
      .split("\n")
      .map((l) => l.replace(/^[-•·▪►*]\s*/, "").trim())
      .filter((l) => l.length > 15);

    if (tailoredLines.length === 0) {
      // Last resort — treat the whole section as a single bullet
      sections.push({
        title: label,
        rewriteLevel,
        bullets: [
          {
            original: originalText.trim(),
            tailored: tailoredText.trim(),
            autoAccepted,
            rewriteLevel,
          },
        ],
      });
      continue;
    }

    sections.push({
      title: label,
      rewriteLevel,
      bullets: tailoredLines.map((tailored, i) => ({
        original: originalLines[i] || tailored,
        tailored,
        autoAccepted,
        rewriteLevel,
      })),
    });
  }

  return sections;
};

// ─── ATS Preview panel ────────────────────────────────────

const ATSPreview = ({ version, sections }) => {
  // Build ATS text from real sections if available
  const previewText =
    sections.length > 0
      ? sections
          .map((s) => {
            const bullets = s.bullets.map((b) => `• ${b.tailored}`).join("\n");
            return `${s.title.toUpperCase()}\n${"-".repeat(40)}\n${bullets}`;
          })
          .join("\n\n")
      : `PROFESSIONAL SUMMARY\n${"-".repeat(40)}\nProduct designer with 7 years experience.\n\nWORK EXPERIENCE\n${"-".repeat(40)}\n• Owned end-to-end design of core product\n\nSKILLS\n${"-".repeat(40)}\nFigma, User Research, Prototyping`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">ATS preview</h3>
        <Badge variant={version?.ats_score >= 80 ? "success" : "warning"}>
          Score: {version?.ats_score || 0}/100
        </Badge>
      </div>
      <div className="font-mono text-xs text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
        {previewText}
      </div>
    </div>
  );
};

// ─── Main CVEditor page ───────────────────────────────────

const CVEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activePanel, setActivePanel] = useState("editor");

  const {
    version,
    job,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    saveVersion,
    updateTone,
  } = useCVEditor();

  const handleSave = async () => {
    try {
      await saveVersion();
      toast.success("CV version saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save.");
    }
  };

  const sections = useMemo(() => {
    if (version?.tailored_content && Object.keys(version.tailored_content).length > 0) {
      return getRealSections(version.tailored_content);
    }
    return getMockSections(job?.job_title);
  }, [version, job]);

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
        <Button variant="outline" onClick={() => navigate("/cv")}>
          Back to My CVs
        </Button>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-gray-500">CV version not found.</p>
        <Button variant="outline" onClick={() => navigate("/cv")}>
          Back to My CVs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate("/cv")}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ← My CVs
            </button>
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            {version.version_name}
          </h2>
          {job && (
            <p className="text-xs text-gray-400 mt-0.5">
              Tailored for {job.job_title} at {job.company_name}
            </p>
          )}
          {version.match_score > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-xs font-semibold text-teal-800">
                  {version.match_score}% match
                </span>
              </div>
              {version.ats_score > 0 && (
                <span className="text-xs text-gray-400">
                  ATS: {version.ats_score}/100
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tone selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {["conservative", "balanced", "bold"].map((t) => (
              <button
                key={t}
                onClick={() => updateTone(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer capitalize ${
                  version.tone === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {hasUnsavedChanges && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save changes
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

      {/* ── Panel tabs ────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id: "editor", label: "CV Editor" },
          { id: "ats", label: "ATS Preview" },
        ].map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activePanel === panel.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {panel.label}
          </button>
        ))}
      </div>

      {/* ── Editor panel ──────────────────────────────── */}
      {activePanel === "editor" && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
            <p className="text-xs text-brand-800">
              <span className="font-semibold">Review each rewrite below.</span>{" "}
              Sections with a strong match were kept as-is. Others were
              rewritten bullet by bullet or fully. Accept what sounds right,
              reject what doesn't — rejected bullets revert to your original.
            </p>
          </div>

          {sections.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-gray-500 text-center py-4">
                No sections found. Try re-running the tailor from the decoder.
              </p>
            </Card>
          ) : (
            sections.map((section) => (
              <CVSection
                key={section.title}
                title={section.title}
                bullets={section.bullets}
                rewriteLevel={section.rewriteLevel}
              />
            ))
          )}

          {/* Bottom actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save all changes
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

      {/* ── ATS preview panel ─────────────────────────── */}
      {activePanel === "ats" && (
        <ATSPreview version={version} sections={sections} />
      )}
    </div>
  );
};

export default CVEditor;
