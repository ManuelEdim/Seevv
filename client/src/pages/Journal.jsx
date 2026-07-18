import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const CATEGORIES = [
  { id: "all",           label: "All",           color: "bg-gray-100 text-gray-600" },
  { id: "career",        label: "Career",         color: "bg-brand-100 text-brand-700" },
  { id: "skill",         label: "Skill",          color: "bg-teal-100 text-teal-700" },
  { id: "project",       label: "Project",        color: "bg-amber-100 text-amber-700" },
  { id: "certification", label: "Certification",  color: "bg-purple-100 text-purple-700" },
  { id: "other",         label: "Other",          color: "bg-gray-100 text-gray-500" },
];

const CV_SECTIONS = ["experience", "skills", "projects", "education", "summary", "achievements"];

const catColor = (cat) =>
  CATEGORIES.find((c) => c.id === cat)?.color || "bg-gray-100 text-gray-500";

const catLabel = (cat) =>
  CATEGORIES.find((c) => c.id === cat)?.label || cat;

const formatDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const groupByDate = (entries) => {
  const groups = {};
  for (const e of entries) {
    const key = e.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
};

// ─── Impact stars ──────────────────────────────────────────
const ImpactStars = ({ value, onChange, readOnly }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={readOnly}
        onClick={() => onChange?.(n * 2)}
        className={`text-base leading-none transition-colors ${
          readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
        } ${value >= n * 2 ? "text-amber-400" : "text-gray-200"}`}
      >
        ★
      </button>
    ))}
  </div>
);

// ─── Add / Edit entry form ─────────────────────────────────
const EntryForm = ({ initial, onSave, onCancel, saving }) => {
  const [title, setTitle]           = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [date, setDate]             = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [category, setCategory]     = useState(initial?.category || "career");
  const [period, setPeriod]         = useState(initial?.period || "daily");
  const [impact, setImpact]         = useState(initial?.impact_score || 6);
  const [cvSections, setCvSections] = useState(initial?.cv_sections || []);
  const [tags, setTags]             = useState((initial?.tags || []).join(", "));
  const titleRef = useRef();

  useEffect(() => { titleRef.current?.focus(); }, []);

  const toggleSection = (s) =>
    setCvSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      date,
      category,
      period,
      impact_score: impact,
      cv_sections: cvSections,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you achieve? (e.g. 'Led migration of auth system to OAuth 2.0')"
          rows={2}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 resize-none"
          required
        />
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add more context, numbers, or outcome (optional)"
        rows={3}
        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 resize-none"
      />

      {/* Row: date + period */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
          <div className="flex gap-1.5">
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2 text-[11px] font-medium rounded-lg border transition-all capitalize cursor-pointer ${
                  period === p ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                category === c.id ? `${c.color} border-transparent` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Impact */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 shrink-0">Impact</label>
        <ImpactStars value={impact} onChange={setImpact} />
        <span className="text-xs text-gray-400">{impact}/10</span>
      </div>

      {/* CV sections */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Feeds into CV section (optional)</label>
        <div className="flex flex-wrap gap-1.5">
          {CV_SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSection(s)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full border capitalize cursor-pointer transition-all ${
                cvSections.includes(s) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="leadership, python, agile…"
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {saving ? "Saving…" : initial ? "Update" : "Add entry"}
        </button>
      </div>
    </form>
  );
};

// ─── Entry card ────────────────────────────────────────────
const EntryCard = ({ entry, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{entry.title}</p>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => onEdit(entry)} className="p-1 text-gray-400 hover:text-brand-600 cursor-pointer transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button onClick={() => onDelete(entry.id)} className="p-1 text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
    </div>

    {entry.description && (
      <p className="text-xs text-gray-500 leading-relaxed mb-2.5">{entry.description}</p>
    )}

    <div className="flex items-center flex-wrap gap-1.5">
      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${catColor(entry.category)}`}>
        {catLabel(entry.category)}
      </span>
      <span className="text-[10px] text-gray-400 capitalize">{entry.period}</span>
      <ImpactStars value={entry.impact_score} readOnly />
      {(entry.cv_sections || []).map((s) => (
        <span key={s} className="px-1.5 py-0.5 text-[10px] rounded-full bg-teal-50 text-teal-700 font-medium capitalize">{s}</span>
      ))}
    </div>

    {(entry.tags || []).length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {entry.tags.map((t) => (
          <span key={t} className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500">#{t}</span>
        ))}
      </div>
    )}
  </div>
);

// ─── Summarise modal ───────────────────────────────────────
const SummariseModal = ({ entries, onClose }) => {
  const [section, setSection] = useState("experience");
  const [selected, setSelected] = useState(new Set(entries.map((e) => e.id)));
  const [bullets, setBullets]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [copied, setCopied]     = useState(false);
  const { toast } = useToast();

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSummarise = async () => {
    setLoading(true); setError(null); setBullets([]);
    try {
      const result = await api.post("/journal/summarize", {
        entryIds: [...selected],
        cvSection: section,
      });
      setBullets(result.bullets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bullets.map((b) => `• ${b}`).join("\n"));
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">Summarise to CV bullets</p>
            <p className="text-xs text-gray-400 mt-0.5">AI converts your entries into polished CV bullet points</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Section picker */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Target CV section</label>
            <div className="flex flex-wrap gap-1.5">
              {CV_SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`px-2.5 py-1 text-xs rounded-full border capitalize cursor-pointer transition-all ${
                    section === s ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Entry selector */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Entries to include ({selected.size})</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {entries.map((e) => (
                <label key={e.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggle(e.id)}
                    className="mt-0.5 accent-brand-600"
                  />
                  <span className="text-xs text-gray-700 leading-snug">{e.title}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Bullets output */}
          {bullets.length > 0 && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-brand-700 mb-2">Generated bullets</p>
              {bullets.map((b, i) => (
                <p key={i} className="text-xs text-gray-800 leading-relaxed">• {b}</p>
              ))}
              <button
                onClick={handleCopy}
                className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-800 cursor-pointer transition-colors"
              >
                {copied ? "Copied ✓" : "Copy all"}
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSummarise}
            disabled={loading || selected.size === 0}
            className="w-full py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {loading ? "Generating…" : "Generate CV bullets"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const Journal = () => {
  const { toast } = useToast();
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [catFilter, setCatFilter]     = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showForm, setShowForm]       = useState(false);
  const [editEntry, setEditEntry]     = useState(null);
  const [saving, setSaving]           = useState(false);
  const [showSummarise, setShowSummarise] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (periodFilter !== "all") params.set("period", periodFilter);
      if (catFilter !== "all") params.set("category", catFilter);
      const data = await api.get(`/journal?${params}`);
      setEntries(data.entries || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, [periodFilter, catFilter]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editEntry) {
        const updated = await api.patch(`/journal/${editEntry.id}`, values);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        toast.success("Entry updated");
      } else {
        const created = await api.post("/journal", values);
        setEntries((prev) => [created, ...prev]);
        toast.success("Entry added");
      }
      setShowForm(false);
      setEditEntry(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/journal/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const grouped = groupByDate(entries);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Achievement Journal</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Log your daily wins, skills, and milestones — they become your CV.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entries.length > 0 && (
            <button
              onClick={() => setShowSummarise(true)}
              className="text-xs px-3 py-2 rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors font-medium"
            >
              Summarise to CV
            </button>
          )}
          <button
            onClick={() => { setEditEntry(null); setShowForm(true); }}
            className="text-xs px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 cursor-pointer transition-colors"
          >
            + Add entry
          </button>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-lg p-5">
          <p className="text-sm font-bold text-gray-900 mb-4">
            {editEntry ? "Edit entry" : "New entry"}
          </p>
          <EntryForm
            initial={editEntry}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditEntry(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        {/* Period tabs */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
          {["all", "daily", "weekly", "monthly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize cursor-pointer transition-all ${
                periodFilter === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p === "all" ? "All periods" : p}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full border cursor-pointer transition-all ${
                catFilter === c.id ? `${c.color} border-transparent` : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-16">
          <img src="/favicon.png" alt="" className="w-10 h-10 animate-pulse" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📓</p>
          <p className="text-base font-semibold text-gray-900 mb-1">Start your career journal</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Log what you accomplished today — even small wins add up to a compelling CV.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 cursor-pointer transition-colors"
          >
            Add your first entry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dayEntries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{formatDate(date)}</p>
                <div className="flex-1 h-px bg-gray-100" />
                <p className="text-[10px] text-gray-400">{dayEntries.length} {dayEntries.length === 1 ? "entry" : "entries"}</p>
              </div>
              <div className="space-y-3">
                {dayEntries.map((e) => (
                  <EntryCard key={e.id} entry={e} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summarise modal */}
      {showSummarise && (
        <SummariseModal entries={entries} onClose={() => setShowSummarise(false)} />
      )}
    </div>
  );
};

export default Journal;
