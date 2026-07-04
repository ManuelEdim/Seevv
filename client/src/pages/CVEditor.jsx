import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Badge, Spinner, Card } from "@/components/ui";
import useCVEditor from "@/hooks/useCVEditor";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";

// ─── Rewrite level config ─────────────────────────────────

const rewriteLabelConfig = {
  none: {
    label: "Strong match — kept as is",
    color: "text-teal-600 bg-teal-50 border-teal-100",
  },
  bullet: {
    label: "Bullets refined",
    color: "text-amber-700 bg-amber-50 border-amber-100",
  },
  full: {
    label: "Fully rewritten",
    color: "text-brand-700 bg-brand-50 border-brand-100",
  },
};

// ─── Count total reviewable bullets ──────────────────────

const countTotalBullets = (tc) => {
  let total = 0;

  if (tc.summary?.rewrite_level !== "none") {
    const bullets =
      Array.isArray(tc.summary?.bullets_tailored) &&
      tc.summary.bullets_tailored.length > 0
        ? tc.summary.bullets_tailored
        : [tc.summary?.tailored].filter(Boolean);
    total += bullets.length;
  }

  if (tc.experience?.rewrite_level !== "none") {
    const roles =
      tc.experience?.roles_tailored || tc.experience?.roles_original || [];
    roles.forEach((role) => {
      total += (role.bullets || []).length;
    });
    if (roles.length === 0) {
      total += (tc.experience?.bullets_tailored || []).length;
    }
  }

  if (tc.skills?.rewrite_level !== "none") {
    const bullets =
      Array.isArray(tc.skills?.bullets_tailored) &&
      tc.skills.bullets_tailored.length > 0
        ? tc.skills.bullets_tailored
        : [tc.skills?.tailored].filter(Boolean);
    total += bullets.length;
  }

  if (tc.achievements?.rewrite_level !== "none") {
    total += (tc.achievements?.bullets_tailored || []).length;
  }

  if (tc.projects?.rewrite_level !== "none") {
    total += (tc.projects?.bullets_tailored || []).length;
  }

  return total;
};

// ─── Accordion wrapper ────────────────────────────────────

const Accordion = ({
  title,
  badge,
  defaultOpen = false,
  children,
  pendingCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
            {title}
          </h3>
          {badge && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${badge.color}`}
            >
              {badge.label}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pendingCount === 0 && (
            <span className="text-xs text-teal-600 font-medium">✓ Done</span>
          )}
          {/* Click to open hint — only shown when closed */}
          {!isOpen && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              click to open
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Single bullet with accept / reject ──────────────────

const BulletRow = ({
  original,
  tailored,
  accepted,
  onAccept,
  onReject,
  autoAccepted,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const unchanged = original === tailored;

  if (autoAccepted && unchanged) {
    return (
      <li className="text-sm text-gray-700 leading-relaxed py-0.5 list-none">
        {tailored}
      </li>
    );
  }

  return (
    <li
      className={`rounded-lg border px-3 py-2 mb-1.5 transition-all duration-150 list-none ${
        accepted === true
          ? "border-teal-200 bg-teal-50"
          : accepted === false
            ? "border-gray-200 bg-gray-50 opacity-50"
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

      {!unchanged && (
        <button
          onClick={() => setShowOriginal((p) => !p)}
          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer mt-1"
        >
          {showOriginal ? "Hide original" : "Show original"}
        </button>
      )}

      {showOriginal && (
        <p className="mt-1.5 text-xs text-gray-400 italic border-t border-gray-200 pt-1.5">
          Original: {original}
        </p>
      )}

      {accepted === undefined && !autoAccepted && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onAccept}
            className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 cursor-pointer"
          >
            ✓ Accept
          </button>
          <button
            onClick={onReject}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 cursor-pointer"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {accepted === true && !autoAccepted && (
        <span className="mt-1 inline-block text-xs text-teal-600 font-medium">
          ✓ Accepted
        </span>
      )}

      {accepted === false && (
        <div className="flex items-center gap-2 mt-1">
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
    </li>
  );
};

// ─── Experience role block ────────────────────────────────

const RoleBlock = ({ role, onDecisionChange, sectionKey, roleIndex }) => {
  const bullets = role.bullets || [];
  const bulletsOriginal = role.bullets_original || bullets;
  const autoAccepted = role.rewrite_level === "none";

  const savedDecisions = role.bullet_decisions || {};
  const [bulletStates, setBulletStates] = useState(
    bullets.map((_, i) =>
      autoAccepted ? true : (savedDecisions[i] ?? undefined),
    ),
  );

  const pendingCount = bulletStates.filter((s) => s === undefined).length;

  const handleDecision = (i, value) => {
    setBulletStates((prev) => {
      const next = [...prev];
      next[i] = value;
      if (onDecisionChange) onDecisionChange(sectionKey, roleIndex, i, value);
      return next;
    });
  };

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div>
          <p className="text-sm font-semibold text-gray-900">{role.title}</p>
          {role.company && (
            <p className="text-xs text-gray-500 mt-0.5">
              {role.company}
              {role.period ? ` · ${role.period}` : ""}
            </p>
          )}
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => {
              setBulletStates(bullets.map(() => true));
              if (onDecisionChange) {
                bullets.forEach((_, i) =>
                  onDecisionChange(sectionKey, roleIndex, i, true),
                );
              }
            }}
            className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer font-medium shrink-0"
          >
            Accept all
          </button>
        )}
      </div>

      <ul className="space-y-1 pl-0 mt-2">
        {bullets.map((bullet, i) => (
          <BulletRow
            key={i}
            original={bulletsOriginal[i] || bullet}
            tailored={bullet}
            accepted={bulletStates[i]}
            autoAccepted={autoAccepted}
            onAccept={() => handleDecision(i, true)}
            onReject={() => handleDecision(i, false)}
          />
        ))}
      </ul>
    </div>
  );
};

// ─── Generic section (summary, skills etc) ────────────────

const GenericSection = ({ sectionKey, label, section, onDecisionChange }) => {
  const autoAccepted = section.accepted === true;
  const rewriteLevel = section.rewrite_level || "full";

  const bullets = (() => {
    const hasBullets =
      Array.isArray(section.bullets_tailored) &&
      section.bullets_tailored.length > 0 &&
      section.bullets_tailored.every((b) => b && b.trim().length > 10);
    if (hasBullets) return section.bullets_tailored;

    const tailored = section.tailored || section.text || "";
    return tailored
      .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
      .map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim())
      .filter((l) => l.length > 20);
  })();

  const bulletsOriginal = (() => {
    if (
      Array.isArray(section.bullets_original) &&
      section.bullets_original.length > 0
    )
      return section.bullets_original;
    const original = section.original || section.text || "";
    return original
      .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
      .map((l) => l.replace(/^[-•·▪▸►*○●✓\d+.)\s]+/, "").trim())
      .filter((l) => l.length > 20);
  })();

  const savedDecisions = section.bullet_decisions || {};
  const [bulletStates, setBulletStates] = useState(
    bullets.map((_, i) =>
      autoAccepted ? true : (savedDecisions[i] ?? undefined),
    ),
  );

  const pendingCount = bulletStates.filter((s) => s === undefined).length;

  const handleDecision = (i, value) => {
    setBulletStates((prev) => {
      const next = [...prev];
      next[i] = value;
      if (onDecisionChange) onDecisionChange(sectionKey, null, i, value);
      return next;
    });
  };

  if (bullets.length === 0) return null;

  const badge = rewriteLabelConfig[rewriteLevel];

  return (
    <Accordion
      title={label}
      badge={badge}
      defaultOpen={sectionKey === "summary"}
      pendingCount={autoAccepted ? 0 : pendingCount}
    >
      {pendingCount > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => {
              setBulletStates(bullets.map(() => true));
              if (onDecisionChange) {
                bullets.forEach((_, i) =>
                  onDecisionChange(sectionKey, null, i, true),
                );
              }
            }}
            className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer font-medium"
          >
            Accept all
          </button>
        </div>
      )}
      <ul className="space-y-1 pl-0">
        {bullets.map((bullet, i) => (
          <BulletRow
            key={i}
            original={bulletsOriginal[i] || bullet}
            tailored={bullet}
            accepted={bulletStates[i]}
            autoAccepted={autoAccepted}
            onAccept={() => handleDecision(i, true)}
            onReject={() => handleDecision(i, false)}
          />
        ))}
      </ul>
    </Accordion>
  );
};

// ─── Experience section ───────────────────────────────────

const ExperienceSection = ({ section, onDecisionChange }) => {
  const rewriteLevel = section.rewrite_level || "full";
  const roles = section.roles_tailored || section.roles_original || [];

  // Track decisions made this session so totalPending stays live.
  // role.bullet_decisions (from props) only reflects what was saved to DB
  // before this page load — it never mutates locally.
  const [sessionDecisions, setSessionDecisions] = useState({});

  const totalPending = roles.reduce((sum, role, ri) => {
    if (role.rewrite_level === "none") return sum;
    const saved = role.bullet_decisions || {};
    return (
      sum +
      (role.bullets || []).filter((_, i) => {
        if (sessionDecisions[`${ri}_${i}`] !== undefined) return false;
        return saved[i] === undefined;
      }).length
    );
  }, 0);

  const handleRoleDecision = (sectionKey, roleIndex, bulletIndex, accepted) => {
    setSessionDecisions((prev) => ({
      ...prev,
      [`${roleIndex}_${bulletIndex}`]: accepted,
    }));
    if (onDecisionChange) onDecisionChange(sectionKey, roleIndex, bulletIndex, accepted);
  };

  const badge = rewriteLabelConfig[rewriteLevel];

  if (roles.length === 0) {
    return (
      <GenericSection
        sectionKey="experience"
        label="Experience"
        section={section}
        onDecisionChange={onDecisionChange}
      />
    );
  }

  return (
    <Accordion
      title="Experience"
      badge={badge}
      defaultOpen={false}
      pendingCount={totalPending}
    >
      {roles.map((role, i) => (
        <RoleBlock
          key={i}
          role={role}
          roleIndex={i}
          sectionKey="experience"
          onDecisionChange={handleRoleDecision}
        />
      ))}
    </Accordion>
  );
};

// ─── ATS Preview ──────────────────────────────────────────

const ATSPreview = ({ version, tailoredContent }) => {
  const lines = [];

  if (tailoredContent?.summary?.tailored) {
    lines.push(`SUMMARY\n${"─".repeat(40)}`);
    lines.push(tailoredContent.summary.tailored.slice(0, 500));
    lines.push("");
  }

  if (tailoredContent?.experience) {
    lines.push(`EXPERIENCE\n${"─".repeat(40)}`);
    const roles =
      tailoredContent.experience.roles_tailored ||
      tailoredContent.experience.roles_original ||
      [];

    if (roles.length > 0) {
      roles.forEach((role) => {
        lines.push(role.title);
        if (role.company) lines.push(role.company);
        (role.bullets || []).forEach((b) => lines.push(`  • ${b}`));
        lines.push("");
      });
    } else {
      const bullets = tailoredContent.experience.bullets_tailored || [];
      bullets.forEach((b) => lines.push(`  • ${b}`));
      lines.push("");
    }
  }

  if (tailoredContent?.skills) {
    lines.push(`SKILLS\n${"─".repeat(40)}`);
    const skillBullets =
      tailoredContent.skills.bullets_tailored ||
      (tailoredContent.skills.tailored
        ? [tailoredContent.skills.tailored]
        : []);
    skillBullets.forEach((b) => lines.push(`  • ${b}`));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">ATS preview</h3>
        <Badge variant={version?.ats_score >= 80 ? "success" : "warning"}>
          Score: {version?.ats_score || 0}/100
        </Badge>
      </div>
      <div className="font-mono text-xs text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
        {lines.join("\n") || "No content to preview yet."}
      </div>
    </div>
  );
};

// ─── Main CV Editor ───────────────────────────────────────

const CVEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activePanel, setActivePanel] = useState("editor");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState("classic");
  const [isSavingDecisions, setIsSavingDecisions] = useState(false);
  const [blindSpots, setBlindSpots] = useState(null);
  const [isLoadingBlindSpots, setIsLoadingBlindSpots] = useState(false);
  const [blindSpotsError, setBlindSpotsError] = useState(null);
  const [localDecisions, setLocalDecisions] = useState({});
  const patchTimeoutRef = useRef(null);

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

  // Seed localDecisions from saved bullet_decisions so the progress bar
  // and export-ready state are correct on page load / re-load.
  useEffect(() => {
    if (!version?.tailored_content) return;
    const tc = version.tailored_content;
    const decisions = {};

    ["summary", "skills", "achievements", "projects"].forEach((key) => {
      if (tc[key]?.rewrite_level !== "none" && tc[key]?.bullet_decisions) {
        Object.entries(tc[key].bullet_decisions).forEach(([idx, val]) => {
          decisions[`${key}_${idx}`] = val;
        });
      }
    });

    if (tc.experience?.rewrite_level !== "none") {
      const roles =
        tc.experience?.roles_tailored || tc.experience?.roles_original || [];
      if (roles.length > 0) {
        roles.forEach((role, ri) => {
          Object.entries(role.bullet_decisions || {}).forEach(([idx, val]) => {
            decisions[`experience_${ri}_${idx}`] = val;
          });
        });
      } else {
        Object.entries(tc.experience?.bullet_decisions || {}).forEach(
          ([idx, val]) => {
            decisions[`experience_${idx}`] = val;
          },
        );
      }
    }

    setLocalDecisions(decisions);
  }, [version?.id, version?.tailored_content]);

  const handleDecisionChange = useCallback(
    async (sectionKey, roleIndex, bulletIndex, accepted) => {
      if (!version?.id) return;

      const decisionKey =
        roleIndex !== null
          ? `${sectionKey}_${roleIndex}_${bulletIndex}`
          : `${sectionKey}_${bulletIndex}`;

      setLocalDecisions((prev) => ({ ...prev, [decisionKey]: accepted }));

      const tc = JSON.parse(JSON.stringify(version.tailored_content || {}));

      if (sectionKey === "experience" && roleIndex !== null) {
        const roles =
          tc.experience?.roles_tailored || tc.experience?.roles_original || [];
        if (roles[roleIndex]) {
          if (!roles[roleIndex].bullet_decisions)
            roles[roleIndex].bullet_decisions = {};
          roles[roleIndex].bullet_decisions[bulletIndex] = accepted;
          if (tc.experience.roles_tailored?.[roleIndex]) {
            tc.experience.roles_tailored[roleIndex].bullet_decisions =
              roles[roleIndex].bullet_decisions;
          }
        }
      } else {
        if (!tc[sectionKey]) tc[sectionKey] = {};
        if (!tc[sectionKey].bullet_decisions)
          tc[sectionKey].bullet_decisions = {};
        tc[sectionKey].bullet_decisions[bulletIndex] = accepted;
      }

      if (patchTimeoutRef.current) clearTimeout(patchTimeoutRef.current);
      patchTimeoutRef.current = setTimeout(async () => {
        setIsSavingDecisions(true);
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.access_token) return;

          await fetch(
            `${import.meta.env.VITE_API_URL}/cv/version/${version.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ tailored_content: tc }),
            },
          );
        } catch (err) {
          console.error("Failed to save decision:", err.message);
        } finally {
          setIsSavingDecisions(false);
        }
      }, 600);
    },
    [version],
  );

  const handleSave = async () => {
    try {
      await saveVersion();
      toast.success("CV version saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save.");
    }
  };

  const handleExportPdf = async () => {
    if (!version?.id) return;
    setIsExporting(true);
    toast.info("Generating your PDF — this takes a few seconds...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/export/cv/pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ versionId: version.id, template: pdfTemplate }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      const disposition = response.headers.get("Content-Disposition");
      const match = disposition && disposition.match(/filename="([^"]+)"/);
      const fileName = match ? match[1] : `${version.version_name || "CV"}.pdf`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    if (!version?.id) return;
    setIsExportingDocx(true);
    toast.info("Generating your DOCX file…");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/export/cv/docx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ versionId: version.id }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      const disposition = response.headers.get("Content-Disposition");
      const match = disposition && disposition.match(/filename="([^"]+)"/);
      const fileName = match ? match[1] : `${version.version_name || "CV"}.docx`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("DOCX downloaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to export DOCX.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleLoadBlindSpots = async () => {
    if (!version?.id) return;
    setIsLoadingBlindSpots(true);
    setBlindSpotsError(null);
    try {
      const data = await api.post("/cv/blind-spots", { versionId: version.id });
      setBlindSpots(Array.isArray(data) ? data : data.blind_spots || []);
    } catch (err) {
      setBlindSpotsError(err.message || "Failed to load blind spots.");
    } finally {
      setIsLoadingBlindSpots(false);
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

  const tc = version.tailored_content || {};
  const hasContent = Object.keys(tc).some(
    (k) => !["match_score", "blind_spots", "tone", "contact_info"].includes(k),
  );

  const totalDecisions = countTotalBullets(tc);
  const localDecisionCount = Object.keys(localDecisions).length;
  const pendingDecisions = Math.max(0, totalDecisions - localDecisionCount);
  const exportReady = totalDecisions > 0 && pendingDecisions === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/cv")}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer mb-1"
          >
            ← My CVs
          </button>
          <h2 className="text-base font-semibold text-gray-900">
            {version.version_name}
          </h2>
          {job && (
            <p className="text-xs text-gray-400 mt-0.5">
              Tailored for {job.job_title} at {job.company_name}
            </p>
          )}
          {version.match_score > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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

          {isSavingDecisions && (
            <span className="text-xs text-gray-400 animate-pulse">
              Saving...
            </span>
          )}

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

          {exportReady && (
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              {[
                { id: "classic", label: "Classic" },
                { id: "two-column", label: "2-Col" },
                { id: "executive", label: "Exec" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPdfTemplate(t.id)}
                  className={`text-xs px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    pdfTemplate === t.id
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={exportReady ? handleExportPdf : undefined}
            isLoading={isExporting}
            disabled={!exportReady}
            title={
              !exportReady
                ? `${pendingDecisions} bullets still need review`
                : `Export as ${pdfTemplate === "two-column" ? "Two-column" : pdfTemplate === "executive" ? "Executive brief" : "Classic"} PDF`
            }
          >
            {exportReady ? "Export PDF" : `${pendingDecisions} pending`}
          </Button>

          {exportReady && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDocx}
              isLoading={isExportingDocx}
              title="Export as Word document (.docx)"
            >
              Export DOCX
            </Button>
          )}
        </div>
      </div>

      {/* ── Panel tabs ────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id: "editor", label: "CV Editor" },
          { id: "ats", label: "ATS Preview" },
          { id: "blind_spots", label: "Blind Spots" },
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

      {/* ── Editor ───────────────────────────────────── */}
      {activePanel === "editor" && (
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
            <p className="text-xs text-brand-800">
              <span className="font-semibold">
                Your CV, section by section.
              </span>{" "}
              Sections with a strong match are kept as-is (green). Others are
              rewritten bullet by bullet or fully. Accept what sounds right,
              reject what doesn't — decisions are saved automatically and
              reflected in your PDF export.
            </p>
          </div>

          {!hasContent ? (
            <Card padding="md">
              <p className="text-sm text-gray-500 text-center py-6">
                No sections found. Try re-running the tailor from the decoder.
              </p>
              <div className="flex justify-center mt-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/decoder?jobId=${version.job_target_id}`)
                  }
                >
                  Go to decoder
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Contact info note */}
              {tc.contact_info && tc.contact_info.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-400 italic">
                    Contact info from your original CV will appear in the
                    exported PDF
                  </p>
                </div>
              )}

              {/* Summary — open by default */}
              {tc.summary && (
                <GenericSection
                  sectionKey="summary"
                  label="Summary"
                  section={tc.summary}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Experience — closed by default */}
              {tc.experience && (
                <ExperienceSection
                  section={tc.experience}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Skills — closed by default */}
              {tc.skills && (
                <GenericSection
                  sectionKey="skills"
                  label="Core Skills & Technologies"
                  section={tc.skills}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Achievements — closed by default */}
              {tc.achievements && (
                <GenericSection
                  sectionKey="achievements"
                  label="Achievements"
                  section={tc.achievements}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Projects — closed by default */}
              {tc.projects && (
                <GenericSection
                  sectionKey="projects"
                  label="Projects"
                  section={tc.projects}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Education — closed by default, always kept */}
              {tc.education && (
                <Accordion
                  title="Education"
                  defaultOpen={false}
                  pendingCount={0}
                >
                  <p className="text-xs text-gray-500 italic mb-2">
                    ✓ Kept from your original CV
                  </p>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {tc.education.original}
                  </div>
                </Accordion>
              )}
            </div>
          )}

          {/* Progress banner */}
          {!exportReady && totalDecisions > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">
                    {pendingDecisions} of {totalDecisions} bullets
                  </span>{" "}
                  still need review before you can export.
                </p>
                <span className="text-xs text-amber-600 font-medium">
                  {Math.round((localDecisionCount / totalDecisions) * 100)}%
                  done
                </span>
              </div>
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (localDecisionCount / totalDecisions) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Bottom actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save all changes
            </Button>
            {exportReady && (
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50 mb-2">
                {[
                  { id: "classic", label: "Classic" },
                  { id: "two-column", label: "Two-column" },
                  { id: "executive", label: "Executive" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPdfTemplate(t.id)}
                    className={`flex-1 text-xs px-2 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                      pdfTemplate === t.id
                        ? "bg-white text-brand-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant={exportReady ? "primary" : "outline"}
              fullWidth
              onClick={exportReady ? handleExportPdf : undefined}
              isLoading={isExporting}
              disabled={!exportReady}
            >
              {exportReady
                ? "Export as PDF"
                : `Review ${pendingDecisions} remaining`}
            </Button>
          </div>
        </div>
      )}

      {/* ── ATS Preview ──────────────────────────────── */}
      {activePanel === "ats" && (
        <ATSPreview version={version} tailoredContent={tc} />
      )}

      {/* ── Blind Spots ──────────────────────────────── */}
      {activePanel === "blind_spots" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Blind Spot Detector</span> — finds skills and achievements on your CV that are undersold or not named clearly. Fix them before a recruiter misses them.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              isLoading={isLoadingBlindSpots}
              onClick={handleLoadBlindSpots}
            >
              {blindSpots ? "Re-analyse" : "Analyse CV"}
            </Button>
          </div>

          {isLoadingBlindSpots && (
            <Card padding="md">
              <div className="flex items-center gap-3 py-4">
                <Spinner size="sm" />
                <p className="text-xs text-gray-500">Reading your CV for hidden strengths…</p>
              </div>
            </Card>
          )}

          {blindSpotsError && (
            <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
              <p className="text-sm text-coral-700">{blindSpotsError}</p>
            </div>
          )}

          {blindSpots && !isLoadingBlindSpots && (
            blindSpots.length === 0 ? (
              <Card padding="md">
                <div className="text-center py-6">
                  <p className="text-sm text-teal-700 font-semibold">No blind spots found</p>
                  <p className="text-xs text-gray-400 mt-1">Your CV is communicating your skills clearly.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {blindSpots.length} blind spot{blindSpots.length !== 1 ? "s" : ""} found
                </p>
                {blindSpots.map((spot, i) => (
                  <div key={i} className="bg-white rounded-xl border border-amber-100 p-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Original text</p>
                      <p className="text-xs text-gray-500 italic leading-relaxed">"{spot.original_text}"</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-1">Blind spot</p>
                      <p className="text-sm text-gray-900 font-medium leading-relaxed">{spot.blind_spot}</p>
                    </div>
                    <div className="bg-brand-50 rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-1">Suggested reframe</p>
                      <p className="text-xs text-brand-800 leading-relaxed">{spot.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {!blindSpots && !isLoadingBlindSpots && (
            <Card padding="md">
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Click "Analyse CV" to detect hidden strengths in your CV.</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CVEditor;
