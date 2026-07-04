import { useState, useEffect } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

const SECTION_TYPES = [
  { value: "summary", label: "Professional Summary" },
  { value: "experience", label: "Experience bullets" },
  { value: "skills", label: "Skills section" },
  { value: "cover_letter", label: "Cover letter paragraph" },
];

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-[10px] font-semibold text-brand-600 hover:text-brand-800 cursor-pointer transition-colors"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
};

const VoiceMirroringPage = () => {
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState("freetext");
  const [voiceSample, setVoiceSample] = useState("");
  const [content, setContent] = useState("");
  const [sectionType, setSectionType] = useState("summary");
  const [cvVersions, setCvVersions] = useState([]);
  const [cvVersionId, setCvVersionId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedSample, setSavedSample] = useState(null);
  const [savingToProfile, setSavingToProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load CV versions + saved voice sample in parallel
    supabase
      .from("cv_versions")
      .select("id, version_name, job_target:job_targets(job_title, company_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setCvVersions(data || []));

    supabase
      .from("profiles")
      .select("voice_sample")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.voice_sample) {
          setSavedSample(data.voice_sample);
          setVoiceSample(data.voice_sample);
          setProfileSaved(true);
        }
      });
  }, [user]);

  const handleSaveToProfile = async () => {
    if (!voiceSample.trim() || !user) return;
    setSavingToProfile(true);
    try {
      await supabase
        .from("profiles")
        .update({ voice_sample: voiceSample, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      setSavedSample(voiceSample);
      setProfileSaved(true);
    } finally {
      setSavingToProfile(false);
    }
  };

  const handleMirror = async () => {
    if (voiceSample.trim().length < 50)
      return setError("Your voice sample needs at least 50 characters.");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = { voiceSample, mode };
      if (mode === "freetext") {
        payload.content = content;
        payload.sectionType = sectionType;
      }
      if (mode === "cv_version") payload.cvVersionId = cvVersionId;
      const data = await api.post("/voice-mirror", payload);
      setResult(data);
    } catch (err) {
      setError(err.message || "Mirror failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Voice Mirroring</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Rewrite your CV or cover letter in your own natural writing voice —
          not generic AI.
        </p>
      </div>

      {/* Voice sample */}
      <Card padding="md">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Your writing sample
              </label>
              {profileSaved && voiceSample === savedSample && (
                <span className="text-[10px] text-teal-600 font-medium">✓ Saved to profile</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Paste anything you've written naturally — a LinkedIn post, email,
              personal statement, blog post. The more the better.
            </p>
            <textarea
              value={voiceSample}
              onChange={(e) => { setVoiceSample(e.target.value); setProfileSaved(false); }}
              rows={5}
              placeholder="Paste 2–5 paragraphs of your own writing here…"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-[10px] ${voiceSample.length < 50 ? "text-gray-300" : "text-teal-600"}`}>
                {voiceSample.length} characters{" "}
                {voiceSample.length >= 50 ? "✓ Ready" : "(need 50+)"}
              </p>
              {voiceSample.trim().length >= 50 && voiceSample !== savedSample && (
                <button
                  onClick={handleSaveToProfile}
                  disabled={savingToProfile}
                  className="text-[10px] font-semibold text-brand-600 hover:text-brand-800 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {savingToProfile ? "Saving…" : "Save to profile →"}
                </button>
              )}
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              What to rewrite
            </label>
            <div className="flex gap-2">
              {[
                { value: "freetext", label: "Paste text" },
                { value: "cv_version", label: "Full CV version" },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border-2 transition-all cursor-pointer ${
                    mode === m.value
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "freetext" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Section type
                </label>
                <select
                  value={sectionType}
                  onChange={(e) => setSectionType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                >
                  {SECTION_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Content to rewrite
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Paste the text you want rewritten in your voice…"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                />
              </div>
            </div>
          )}

          {mode === "cv_version" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Select CV version
              </label>
              <select
                value={cvVersionId}
                onChange={(e) => setCvVersionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
              >
                <option value="">Choose a CV version…</option>
                {cvVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.version_name}
                    {v.job_target
                      ? ` — ${v.job_target.job_title} @ ${v.job_target.company_name}`
                      : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                Rewrites summary and skills sections in your voice.
              </p>
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            isLoading={loading}
            disabled={
              voiceSample.trim().length < 50 ||
              (mode === "freetext" && !content) ||
              (mode === "cv_version" && !cvVersionId)
            }
            onClick={handleMirror}
          >
            Mirror my voice
          </Button>
        </div>
      </Card>

      {loading && (
        <Card padding="md">
          <div className="flex flex-col items-center py-8 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">
              Analysing your voice and rewriting…
            </p>
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              Voice-mirrored output
            </p>
          </div>

          {/* Freetext result */}
          {result.rewritten && (
            <div className="bg-white rounded-xl border border-teal-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
                  Rewritten
                </p>
                <CopyButton text={result.rewritten} />
              </div>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {result.rewritten}
              </p>
            </div>
          )}

          {/* CV version results */}
          {result.sections &&
            Object.entries(result.sections).map(([key, text]) => (
              <div
                key={key}
                className="bg-white rounded-xl border border-teal-100 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
                    {key}
                  </p>
                  <CopyButton text={text} />
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {text}
                </p>
              </div>
            ))}

          <p className="text-[10px] text-gray-400 text-center">
            Copy the output and paste it into your CV editor to apply changes.
          </p>
        </div>
      )}
    </div>
  );
};

const VoiceMirroringGated = () => (
  <FeatureGate feature="voice_mirroring">
    <VoiceMirroringPage />
  </FeatureGate>
);
export default VoiceMirroringGated;
