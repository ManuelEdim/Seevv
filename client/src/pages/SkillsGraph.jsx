import { useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

// ─── Score bar ─────────────────────────────────────────────
const ScoreBar = ({ skill, score, color }) => (
  <div className="flex items-center gap-3">
    <p className="text-xs text-gray-700 w-36 shrink-0 truncate font-medium">{skill}</p>
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="text-xs text-gray-400 w-8 text-right shrink-0">{score}</span>
  </div>
);

// ─── Radar chart (SVG) ─────────────────────────────────────
const RadarChart = ({ skills }) => {
  if (!skills || skills.length === 0) return null;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const items = skills.slice(0, 6);
  const n = items.length;

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const point = (i, score) => {
    const ratio = score / 100;
    const a = angle(i);
    return {
      x: cx + r * ratio * Math.cos(a),
      y: cy + r * ratio * Math.sin(a),
    };
  };

  const gridPoint = (i, ratio) => {
    const a = angle(i);
    return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a) };
  };

  const polygon = items.map((s, i) => point(i, s.score));
  const polyStr = polygon.map((p) => `${p.x},${p.y}`).join(" ");

  const labelPoint = (i) => {
    const a = angle(i);
    return {
      x: cx + (r + 18) * Math.cos(a),
      y: cy + (r + 18) * Math.sin(a),
    };
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((ratio, ri) => (
        <polygon
          key={ri}
          points={Array.from({ length: n }, (_, i) => {
            const p = gridPoint(i, ratio);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const p = gridPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon
        points={polyStr}
        fill="rgba(3, 56, 118, 0.12)"
        stroke="#033876"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {polygon.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#033876" />
      ))}
      {/* Labels */}
      {items.map((s, i) => {
        const lp = labelPoint(i);
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fill="#6b7280"
            className="font-medium"
          >
            {s.skill.length > 12 ? s.skill.slice(0, 11) + "…" : s.skill}
          </text>
        );
      })}
    </svg>
  );
};

// ─── Level badge ───────────────────────────────────────────
const levelConfig = {
  junior:    { label: "Junior",    color: "bg-gray-100 text-gray-600 border-gray-200" },
  mid:       { label: "Mid-level", color: "bg-amber-50 text-amber-700 border-amber-200" },
  senior:    { label: "Senior",    color: "bg-teal-50 text-teal-700 border-teal-200" },
  executive: { label: "Executive", color: "bg-brand-50 text-brand-700 border-brand-200" },
};

// ─── Category section ──────────────────────────────────────
const SkillCategory = ({ title, skills, barColor }) => {
  if (!skills?.length) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>
      <div className="space-y-2.5">
        {skills.map((s) => (
          <ScoreBar key={s.skill} skill={s.skill} score={s.score} color={barColor} />
        ))}
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const SkillsGraph = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await api.get("/skills/profile");
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const levelConf = levelConfig[profile?.level] || levelConfig.mid;

  return (
    <div className="mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Skills Graph</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          A visual breakdown of your skill profile, extracted from your active CV.
        </p>
      </div>

      {!profile && !isLoading && (
        <Card padding="md">
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#033876" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Generate your skill profile</p>
              <p className="text-xs text-gray-400 mt-1">
                Seevv analyses your active CV and maps your technical, soft, and domain skills with estimated proficiency scores.
              </p>
            </div>
            <Button variant="primary" onClick={handleGenerate}>
              Analyse my skills
            </Button>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Mapping your skills…</p>
          </div>
        </Card>
      )}

      {profile && !isLoading && (
        <>
          {/* Summary */}
          <Card padding="md">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${levelConf.color}`}>
                    {levelConf.label}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleGenerate} isLoading={isLoading}>
                Refresh
              </Button>
            </div>

            {/* Top skills */}
            {profile.top_skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                {profile.top_skills.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-100 font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Radar + bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Radar chart */}
            <Card padding="md">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Skill radar</p>
              <RadarChart skills={[
                ...(profile.technical || []).slice(0, 3),
                ...(profile.soft || []).slice(0, 2),
                ...(profile.domain || []).slice(0, 1),
              ]} />
              <p className="text-[10px] text-gray-300 text-center mt-2">Top 6 skills from all categories</p>
            </Card>

            {/* Gaps */}
            <Card padding="md">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Skill gaps to close</p>
              {profile.gaps?.length > 0 ? (
                <ul className="space-y-2">
                  {profile.gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-coral-400 mt-0.5 shrink-0">✗</span>
                      <p className="text-sm text-gray-700">{gap}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">No significant gaps detected at your level.</p>
              )}
            </Card>
          </div>

          {/* Skill bars */}
          <Card padding="md">
            <div className="space-y-6">
              <SkillCategory
                title="Technical skills"
                skills={profile.technical}
                barColor="bg-brand-500"
              />
              <SkillCategory
                title="Soft skills"
                skills={profile.soft}
                barColor="bg-teal-500"
              />
              <SkillCategory
                title="Domain expertise"
                skills={profile.domain}
                barColor="bg-amber-400"
              />
            </div>
          </Card>
        </>
      )}

      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

const SkillsGraphGated = () => (
  <FeatureGate feature="skills_graph"><SkillsGraph /></FeatureGate>
);
export default SkillsGraphGated;
