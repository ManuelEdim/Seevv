import { useState } from "react";
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
      <li className="text-sm text-gray-700 leading-relaxed py-0.5">
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

const RoleBlock = ({ role }) => {
  const bullets = role.bullets || [];
  const bulletsOriginal = role.bullets_original || bullets;
  const autoAccepted = role.rewrite_level === "none";

  const [bulletStates, setBulletStates] = useState(
    bullets.map(() => (autoAccepted ? true : undefined)),
  );

  const pendingCount = bulletStates.filter((s) => s === undefined).length;

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <p className="text-sm font-semibold text-gray-900">{role.title}</p>
        {pendingCount > 0 && (
          <button
            onClick={() => setBulletStates(bullets.map(() => true))}
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
            onAccept={() =>
              setBulletStates((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              })
            }
            onReject={() =>
              setBulletStates((prev) => {
                const next = [...prev];
                next[i] = false;
                return next;
              })
            }
          />
        ))}
      </ul>
    </div>
  );
};

// ─── Generic section (summary, skills etc) ────────────────

const GenericSection = ({ sectionKey, label, section }) => {
  const autoAccepted = section.accepted === true;
  const rewriteLevel = section.rewrite_level || "full";

  const bullets = (() => {
    const hasBullets =
      Array.isArray(section.bullets_tailored) &&
      section.bullets_tailored.length > 0 &&
      section.bullets_tailored.every((b) => b && b.trim().length > 35);

    if (hasBullets) return section.bullets_tailored;

    const tailored = section.tailored || section.text || "";
    return tailored
      .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
      .map((l) => l.replace(/^[-•·▪▸►*○✓\d+.)\s]+/, "").trim())
      .filter((l) => l.length > 35);
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
      .map((l) => l.replace(/^[-•·▪▸►*○✓\d+.)\s]+/, "").trim())
      .filter((l) => l.length > 35);
  })();

  const [bulletStates, setBulletStates] = useState(
    bullets.map(() => (autoAccepted ? true : undefined)),
  );

  const pendingCount = bulletStates.filter((s) => s === undefined).length;

  if (bullets.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
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
            onClick={() => setBulletStates(bullets.map(() => true))}
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
            onAccept={() =>
              setBulletStates((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              })
            }
            onReject={() =>
              setBulletStates((prev) => {
                const next = [...prev];
                next[i] = false;
                return next;
              })
            }
          />
        ))}
      </ul>
    </div>
  );
};

// ─── Experience section ───────────────────────────────────

const ExperienceSection = ({ section }) => {
  const rewriteLevel = section.rewrite_level || "full";
  const roles = section.roles_tailored || section.roles_original || [];

  if (roles.length === 0) {
    return (
      <GenericSection
        sectionKey="experience"
        label="Experience"
        section={section}
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
        <RoleBlock key={i} role={role} />
      ))}
    </div>
  );
};

// ─── ATS Preview ──────────────────────────────────────────

const ATSPreview = ({ version, tailoredContent }) => {
  const lines = [];

  if (tailoredContent?.summary?.tailored) {
    lines.push(`SUMMARY\n${"─".repeat(40)}`);
    lines.push(tailoredContent.summary.tailored.slice(0, 400));
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
        lines.push(`${role.title}`);
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

  if (tailoredContent?.skills?.tailored) {
    lines.push(`SKILLS\n${"─".repeat(40)}`);
    const skillBullets = tailoredContent.skills.bullets_tailored || [
      tailoredContent.skills.tailored,
    ];
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

  const handleExportPdf = async () => {
    if (!version?.id) return;
    setIsExporting(true);
    toast.info("Generating your PDF — this takes a few seconds...");

    try {
      // Get current session token
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

      // Trigger browser download
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
            onClick={handleExportPdf}
            isLoading={isExporting}
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

      {/* ── Editor ───────────────────────────────────── */}
      {activePanel === "editor" && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
            <p className="text-xs text-brand-800">
              <span className="font-semibold">
                Your CV, section by section.
              </span>{" "}
              Sections with a strong match are kept as-is (green). Others are
              rewritten bullet by bullet or fully. Accept what sounds right,
              reject what doesn't — rejected bullets revert to your original.
            </p>
          </div>

          {!hasContent ? (
            <Card padding="md">
              <p className="text-sm text-gray-500 text-center py-6">
                No sections found. Try re-running the tailor from the decoder.
              </p>
              <div className="flex justify-center">
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
                />
              )}

              {/* Experience */}
              {tc.experience && <ExperienceSection section={tc.experience} />}

              {/* Skills */}
              {tc.skills && (
                <GenericSection
                  sectionKey="skills"
                  label="Core Skills & Technologies"
                  section={tc.skills}
                />
              )}

              {/* Achievements */}
              {tc.achievements && (
                <GenericSection
                  sectionKey="achievements"
                  label="Achievements"
                  section={tc.achievements}
                />
              )}

              {/* Projects */}
              {tc.projects && (
                <GenericSection
                  sectionKey="projects"
                  label="Projects"
                  section={tc.projects}
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
                    ✓ Education kept from your original CV
                  </p>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {tc.education.original}
                  </div>
                </div>
              )}
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
            <Button
              variant="outline"
              fullWidth
              onClick={handleExportPdf}
              isLoading={isExporting}
            >
              Export as PDF
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
