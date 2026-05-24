import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/ui";
import FeatureGate from "@/components/FeatureGate";
import { useAuthStore } from "@/store";
import { hasFeature } from "@/lib/features";

// ─── Copy button ───────────────────────────────────────────

const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 font-medium transition-colors cursor-pointer shrink-0">
      {copied ? (
        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied</>
      ) : (
        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>{label}</>
      )}
    </button>
  );
};

// ─── Message card ──────────────────────────────────────────

const MessageCard = ({ title, charCount, text, badge }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-800">{title}</p>
        {badge && <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold">{badge}</span>}
        {charCount && <span className="text-[10px] text-gray-400">{charCount} chars</span>}
      </div>
      <CopyButton text={text} />
    </div>
    <div className="px-4 py-4">
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  </div>
);

// ─── Main page ─────────────────────────────────────────────

const RecruiterOutreach = () => {
  const { toast } = useToast();
  const profile = useAuthStore((s) => s.profile);
  const plan = profile?.plan || "free";
  const overrides = profile?.feature_overrides || {};
  const hasVoice = hasFeature(plan, "voice_mirroring", overrides);

  const [form, setForm] = useState({
    recruiterName: "",
    recruiterRole: "",
    company: "",
    targetRole: "",
    recruiterNotes: "",
    useVoice: false,
  });
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (k) => () => setForm((f) => ({ ...f, [k]: !f[k] }));

  const handleGenerate = async () => {
    if (!form.recruiterName || !form.company || !form.targetRole) {
      return toast.error("Recruiter name, company, and target role are required.");
    }
    setLoading(true);
    try {
      const data = await api.post("/outreach/generate", form);
      setMessages(data.messages);
    } catch {
      toast.error("Failed to generate messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureGate feature="recruiter_outreach">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Recruiter Outreach</h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">
            Generate personalized LinkedIn messages, connection requests, and follow-up emails — grounded in your CV and the company context. Most hires happen through outreach, not job boards.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Recruiter / hiring manager name *</label>
              <input value={form.recruiterName} onChange={set("recruiterName")} placeholder="e.g. Sarah Johnson" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Their role / title</label>
              <input value={form.recruiterRole} onChange={set("recruiterRole")} placeholder="e.g. Head of Talent, Engineering Manager" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company *</label>
              <input value={form.company} onChange={set("company")} placeholder="e.g. Stripe, Flutterwave, Google" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role you are targeting *</label>
              <input value={form.targetRole} onChange={set("targetRole")} placeholder="e.g. Senior Software Engineer" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Additional context (optional)</label>
              <textarea
                value={form.recruiterNotes}
                onChange={set("recruiterNotes")}
                placeholder="Anything you know about this recruiter, a recent company news item, a mutual connection, a specific open role they posted..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400 resize-none"
              />
            </div>
          </div>

          {/* Voice mirroring toggle */}
          <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${hasVoice ? "bg-brand-50 border border-brand-100" : "bg-gray-50 border border-gray-100"}`}>
            <button
              onClick={hasVoice ? toggle("useVoice") : undefined}
              className={`relative w-9 h-5 rounded-full transition-colors ${form.useVoice && hasVoice ? "bg-brand-600" : "bg-gray-200"} ${hasVoice ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.useVoice && hasVoice ? "translate-x-4" : ""}`} />
            </button>
            <div>
              <p className="text-xs font-semibold text-gray-700">Mirror my writing style</p>
              <p className="text-[11px] text-gray-400">{hasVoice ? "Uses your Voice Mirror sample to match your natural tone" : "Requires Voice Mirroring feature (Starter plan)"}</p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner size="sm" /> Crafting messages…</> : "Generate outreach messages →"}
          </button>
        </div>

        {/* Results */}
        {messages && (
          <div className="space-y-4">
            {/* LinkedIn connection note */}
            <MessageCard
              title="LinkedIn connection request"
              badge="≤300 chars"
              charCount={messages.linkedin_connection_note?.length}
              text={messages.linkedin_connection_note}
            />

            {/* LinkedIn message */}
            <MessageCard
              title="LinkedIn message (after connecting)"
              text={messages.linkedin_message}
            />

            {/* Email */}
            {messages.follow_up_email && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Follow-up email (if no reply after 1 week)</p>
                    <p className="text-[11px] text-gray-400">Subject: {messages.follow_up_email.subject}</p>
                  </div>
                  <CopyButton text={`Subject: ${messages.follow_up_email.subject}\n\n${messages.follow_up_email.body}`} label="Copy email" />
                </div>
                <div className="px-4 py-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{messages.follow_up_email.body}</p>
                </div>
              </div>
            )}

            {/* Personalization + tips */}
            <div className="grid sm:grid-cols-2 gap-4">
              {messages.personalization_checklist?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-2">Before you send — research checklist</p>
                  <ul className="space-y-1.5">
                    {messages.personalization_checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                        <span className="mt-0.5 shrink-0">□</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-3">
                {messages.best_send_time && (
                  <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-1">Best time to send</p>
                    <p className="text-xs text-teal-800">{messages.best_send_time}</p>
                  </div>
                )}
                {messages.avoid?.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-2">Avoid these mistakes</p>
                    <ul className="space-y-1">
                      {messages.avoid.map((item, i) => (
                        <li key={i} className="text-xs text-red-700 flex items-start gap-1.5"><span className="mt-0.5">✕</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default RecruiterOutreach;
