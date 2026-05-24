import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/ui";
import FeatureGate from "@/components/FeatureGate";

// ─── Copy button ───────────────────────────────────────────

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 font-medium transition-colors cursor-pointer">
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
};

// ─── Section wrapper ───────────────────────────────────────

const Section = ({ title, children, accent = "brand" }) => {
  const colors = { brand: "bg-brand-50 border-brand-100", teal: "bg-teal-50 border-teal-100", amber: "bg-amber-50 border-amber-100" };
  return (
    <div className={`rounded-2xl border p-5 ${colors[accent]}`}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</p>
      {children}
    </div>
  );
};

// ─── Roleplay chat ─────────────────────────────────────────

const RoleplayChat = ({ context }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([
    { role: "recruiter", content: "Hi! Thanks for your interest in the role. We'd like to move forward and are prepared to offer you the position at the salary we discussed. Do you have any questions?", coach: null }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg, coach: null }]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await api.post("/negotiation/roleplay", { userMessage: userMsg, context, history });
      const raw = data.response || "";
      const coachMatch = raw.match(/\[COACH:(.*?)\]/s);
      const coach = coachMatch ? coachMatch[1].trim() : null;
      const recruiterText = raw.replace(/\[COACH:.*?\]/s, "").trim();
      setMessages((prev) => [...prev, { role: "recruiter", content: recruiterText, coach }]);
    } catch {
      toast.error("Roleplay failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        <p className="text-xs font-semibold text-gray-700">Live Negotiation Roleplay — AI recruiter is ready</p>
      </div>
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              m.role === "user"
                ? "bg-brand-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
            {m.coach && (
              <div className="max-w-[85%] px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
                <span className="font-semibold">Coach: </span>{m.coach}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type your response to the recruiter..."
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-brand-400"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-800 disabled:opacity-50 transition-colors cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────

const CURRENCIES = ["USD", "GBP", "EUR", "NGN", "CAD", "AUD", "ZAR"];

const NegotiationCoach = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState("coach");
  const [form, setForm] = useState({ roleTitle: "", company: "", location: "", offeredSalary: "", currency: "USD", experience: "", targetSalary: "" });
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.roleTitle || !form.offeredSalary) return toast.error("Role title and offered salary are required.");
    setLoading(true);
    try {
      const data = await api.post("/negotiation/coach", form);
      setCoaching(data.coaching);
      setTab("results");
    } catch {
      toast.error("Failed to generate coaching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureGate feature="negotiation_coach">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Negotiation Coach</h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">Get market data, a counter-offer script, objection handlers, and live roleplay practice before the real call.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {[["coach", "Get Coaching"], ["results", "My Strategy"], ["roleplay", "Roleplay Practice"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Coach form */}
        {tab === "coach" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role title *</label>
                <input value={form.roleTitle} onChange={set("roleTitle")} placeholder="e.g. Senior Product Manager" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company</label>
                <input value={form.company} onChange={set("company")} placeholder="e.g. Stripe" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location</label>
                <input value={form.location} onChange={set("location")} placeholder="e.g. London, UK / Remote" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Years of experience</label>
                <input value={form.experience} onChange={set("experience")} placeholder="e.g. 5" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency *</label>
                <select value={form.currency} onChange={set("currency")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Offered salary *</label>
                <input value={form.offeredSalary} onChange={set("offeredSalary")} placeholder="e.g. 85000" type="number" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your target salary (optional)</label>
                <input value={form.targetSalary} onChange={set("targetSalary")} placeholder="What you're aiming for — e.g. 100000" type="number" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-brand-400" />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <><Spinner size="sm" /> Generating strategy…</> : "Generate negotiation strategy →"}
            </button>
          </div>
        )}

        {/* Results */}
        {tab === "results" && coaching && (
          <div className="space-y-4">
            {/* Market range */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Market salary range</p>
              <div className="flex items-end gap-4 mb-3">
                {[["Low", coaching.market_range?.low, "text-gray-500"], ["Mid", coaching.market_range?.mid, "text-brand-700 text-lg font-bold"], ["High", coaching.market_range?.high, "text-teal-700"]].map(([l, v, cls]) => (
                  <div key={l} className="text-center flex-1">
                    <p className={`font-semibold ${cls}`}>{v}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 italic">{coaching.market_range?.source_note}</p>
              <div className="mt-3 p-3 bg-brand-50 rounded-xl">
                <p className="text-xs text-brand-800 font-medium">{coaching.assessment}</p>
                <p className="text-xs text-brand-700 mt-1 font-semibold">Recommended ask: {coaching.recommended_ask}</p>
              </div>
            </div>

            {/* Counter-offer script */}
            <Section title="Counter-offer script (word-for-word)" accent="teal">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{coaching.counter_offer_script}</p>
                <CopyButton text={coaching.counter_offer_script} />
              </div>
            </Section>

            {/* Email template */}
            {coaching.email_template && (
              <Section title="Counter-offer email template" accent="brand">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-gray-700">Subject: {coaching.email_template.subject}</p>
                  <CopyButton text={`Subject: ${coaching.email_template.subject}\n\n${coaching.email_template.body}`} />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{coaching.email_template.body}</p>
              </Section>
            )}

            {/* Objection handlers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Objection handlers</p>
              <div className="space-y-3">
                {coaching.objection_handlers?.map((o, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-red-50 px-3 py-2 flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <p className="text-xs font-semibold text-red-700">"{o.objection}"</p>
                    </div>
                    <div className="px-3 py-2 bg-teal-50 flex items-start justify-between gap-2">
                      <p className="text-xs text-teal-800 leading-relaxed">{o.response}</p>
                      <CopyButton text={o.response} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips + walk away */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Section title="Negotiation tips" accent="amber">
                <ul className="space-y-1.5">
                  {coaching.negotiation_tips?.map((t, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>{t}
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Non-salary items to negotiate" accent="brand">
                <div className="flex flex-wrap gap-1.5">
                  {coaching.non_salary_items?.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-white rounded-lg border border-brand-100 text-xs text-brand-700">{item}</span>
                  ))}
                </div>
                {coaching.walk_away_point && (
                  <p className="text-xs text-gray-500 italic mt-3 border-t border-brand-100 pt-2">{coaching.walk_away_point}</p>
                )}
              </Section>
            </div>
          </div>
        )}

        {tab === "results" && !coaching && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-gray-400">Generate a strategy first using the Coach tab.</p>
          </div>
        )}

        {/* Roleplay */}
        {tab === "roleplay" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
              <span className="font-semibold">Practice mode: </span>
              The AI plays a realistic recruiter. The yellow coaching notes after each message tell you how you're doing. Try to negotiate for {form.offeredSalary ? `above ${form.offeredSalary} ${form.currency}` : "your target salary"}.
            </div>
            <RoleplayChat
              context={`Negotiating salary for ${form.roleTitle || "a new position"} at ${form.company || "a company"}. Offered salary: ${form.offeredSalary || "unknown"} ${form.currency}.`}
            />
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default NegotiationCoach;
