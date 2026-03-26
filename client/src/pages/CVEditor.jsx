import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Badge, Spinner, Card } from "@/components/ui";
import useCVEditor from "@/hooks/useCVEditor";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";

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

// ─── Calculate pending decisions across all sections ──────

const getTotalPending = (tc) => {
  let pending = 0;
  let total = 0;

  // Summary
  if (tc.summary && tc.summary.rewrite_level !== "none") {
    const decisions = tc.summary.bullet_decisions || {};
    const bullets =
      Array.isArray(tc.summary.bullets_tailored) &&
      tc.summary.bullets_tailored.length > 0
        ? tc.summary.bullets_tailored
        : [tc.summary.tailored].filter(Boolean);
    bullets.forEach((_, i) => {
      total++;
      if (decisions[i] === undefined) pending++;
    });
  }

  // Experience roles
  if (tc.experience && tc.experience.rewrite_level !== "none") {
    const roles =
      tc.experience.roles_tailored || tc.experience.roles_original || [];
    roles.forEach((role) => {
      const decisions = role.bullet_decisions || {};
      (role.bullets || []).forEach((_, i) => {
        total++;
        if (decisions[i] === undefined) pending++;
      });
    });

    // Fallback flat bullets if no roles
    if (roles.length === 0) {
      const decisions = tc.experience.bullet_decisions || {};
      (tc.experience.bullets_tailored || []).forEach((_, i) => {
        total++;
        if (decisions[i] === undefined) pending++;
      });
    }
  }

  // Skills
  if (tc.skills && tc.skills.rewrite_level !== "none") {
    const decisions = tc.skills.bullet_decisions || {};
    const bullets =
      Array.isArray(tc.skills.bullets_tailored) &&
      tc.skills.bullets_tailored.length > 0
        ? tc.skills.bullets_tailored
        : [tc.skills.tailored].filter(Boolean);
    bullets.forEach((_, i) => {
      total++;
      if (decisions[i] === undefined) pending++;
    });
  }

  // Achievements
  if (tc.achievements && tc.achievements.rewrite_level !== "none") {
    const decisions = tc.achievements.bullet_decisions || {};
    (tc.achievements.bullets_tailored || []).forEach((_, i) => {
      total++;
      if (decisions[i] === undefined) pending++;
    });
  }

  // Projects
  if (tc.projects && tc.projects.rewrite_level !== "none") {
    const decisions = tc.projects.bullet_decisions || {};
    (tc.projects.bullets_tailored || []).forEach((_, i) => {
      total++;
      if (decisions[i] === undefined) pending++;
    });
  }

  return { pending, total };
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
      if (onDecisionChange) {
        onDecisionChange(sectionKey, roleIndex, i, value);
      }
      return next;
    });
  };

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <p className="text-sm font-semibold text-gray-900">{role.title}</p>
        {pendingCount > 0 && (
          <button
            onClick={() => {
              const allAccepted = bullets.map(() => true);
              setBulletStates(allAccepted);
              if (onDecisionChange) {
                bullets.forEach((_, i) =>
                  onDecisionChange(sectionKey, roleIndex, i, true),
                );
              }
            }}
            className="text-xs text-brand-600 hover:text-brand-800 cursor-pointer font-medium flex-shrink-0"
          >
            Accept all
          </button>
        )}
      </div>

      {role.company && (
        <p className="text-xs text-gray-500 mb-2">{role.company}</p>
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

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
            {label}
          </h3>
          {rewriteLabelConfig[rewriteLevel] && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${rewriteLabelConfig[rewriteLevel].color}`}
            >
              {rewriteLabelConfig[rewriteLevel].label}
            </span>
          )}
        </div>
        {pendingCount > 0 && (
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
        )}
      </div>
      <div className="h-px bg-gray-200 mb-3" />

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
    </div>
  );
};

// ─── Experience section ───────────────────────────────────

const ExperienceSection = ({ section, onDecisionChange }) => {
  const rewriteLevel = section.rewrite_level || "full";
  const roles = section.roles_tailored || section.roles_original || [];

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
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
          Experience
        </h3>
        {rewriteLabelConfig[rewriteLevel] && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${rewriteLabelConfig[rewriteLevel].color}`}
          >
            {rewriteLabelConfig[rewriteLevel].label}
          </span>
        )}
      </div>
      <div className="h-px bg-gray-200 mb-3" />
      {roles.map((role, i) => (
        <RoleBlock
          key={i}
          role={role}
          roleIndex={i}
          sectionKey="experience"
          onDecisionChange={onDecisionChange}
        />
      ))}
    </div>
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
  const [isSavingDecisions, setIsSavingDecisions] = useState(false);

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

  // Save accept/reject decision back to Supabase immediately
  const handleDecisionChange = useCallback(
    async (sectionKey, roleIndex, bulletIndex, accepted) => {
      if (!version?.id) return;
      setIsSavingDecisions(true);

      try {
        const tc = JSON.parse(JSON.stringify(version.tailored_content || {}));

        if (sectionKey === "experience" && roleIndex !== null) {
          const roles =
            tc.experience?.roles_tailored ||
            tc.experience?.roles_original ||
            [];
          if (roles[roleIndex]) {
            if (!roles[roleIndex].bullet_decisions) {
              roles[roleIndex].bullet_decisions = {};
            }
            roles[roleIndex].bullet_decisions[bulletIndex] = accepted;
            if (tc.experience.roles_tailored?.[roleIndex]) {
              tc.experience.roles_tailored[roleIndex].bullet_decisions =
                roles[roleIndex].bullet_decisions;
            }
          }
        } else {
          if (!tc[sectionKey]) tc[sectionKey] = {};
          if (!tc[sectionKey].bullet_decisions) {
            tc[sectionKey].bullet_decisions = {};
          }
          tc[sectionKey].bullet_decisions[bulletIndex] = accepted;
        }

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
          body: JSON.stringify({ versionId: version.id }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${version.version_name || "CV"}.pdf`;
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

  // ── Export lock logic ─────────────────────────────────
  const { pending: pendingDecisions, total: totalDecisions } =
    getTotalPending(tc);
  const exportReady = pendingDecisions === 0;

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

          {/* Export PDF — locked until all reviewed */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportReady ? handleExportPdf : undefined}
            isLoading={isExporting}
            disabled={!exportReady}
            title={
              !exportReady
                ? `${pendingDecisions} bullets still need review`
                : "Export PDF"
            }
          >
            {exportReady ? "Export PDF" : `${pendingDecisions} pending`}
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 lg:p-8">
              {/* Contact info note */}
              {tc.contact_info && tc.contact_info.length > 0 && (
                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                  <p className="text-xs text-gray-400 italic">
                    Contact info from your original CV
                  </p>
                </div>
              )}

              {/* Summary */}
              {tc.summary && (
                <GenericSection
                  sectionKey="summary"
                  label="Summary"
                  section={tc.summary}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Experience */}
              {tc.experience && (
                <ExperienceSection
                  section={tc.experience}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Skills */}
              {tc.skills && (
                <GenericSection
                  sectionKey="skills"
                  label="Core Skills & Technologies"
                  section={tc.skills}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Achievements */}
              {tc.achievements && (
                <GenericSection
                  sectionKey="achievements"
                  label="Achievements"
                  section={tc.achievements}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Projects */}
              {tc.projects && (
                <GenericSection
                  sectionKey="projects"
                  label="Projects"
                  section={tc.projects}
                  onDecisionChange={handleDecisionChange}
                />
              )}

              {/* Education — always kept */}
              {tc.education && (
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">
                    Education
                  </h3>
                  <div className="h-px bg-gray-200 mb-3" />
                  <p className="text-xs text-gray-500 italic mb-2">
                    ✓ Kept from your original CV
                  </p>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {tc.education.original}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress banner + bottom actions */}
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
                  {Math.round(
                    ((totalDecisions - pendingDecisions) / totalDecisions) *
                      100,
                  )}
                  % done
                </span>
              </div>
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      ((totalDecisions - pendingDecisions) / totalDecisions) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save all changes
            </Button>
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
    </div>
  );
};

export default CVEditor;
