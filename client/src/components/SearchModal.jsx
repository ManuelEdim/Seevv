import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const TYPE_ICONS = {
  job_target:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  cv:           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  cover_letter: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  tracker:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

const SearchModal = ({ onClose }) => {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState(0);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.get(`/search?q=${encodeURIComponent(q)}&limit=12`);
      setResults(data.results || []);
      setActive(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 220);
    return () => clearTimeout(timer);
  }, [query, search]);

  const go = (result) => {
    navigate(result.path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { setActive((a) => Math.min(a + 1, results.length - 1)); e.preventDefault(); return; }
    if (e.key === "ArrowUp")   { setActive((a) => Math.max(a - 1, 0)); e.preventDefault(); return; }
    if (e.key === "Enter" && results[active]) go(results[active]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs, CVs, cover letters…"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin shrink-0" />
          )}
          <kbd className="hidden sm:block text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded font-mono shrink-0">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={`${r.type}:${r.id}`}>
                <button
                  onClick={() => go(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${i === active ? "bg-gray-50" : "hover:bg-gray-50"}`}
                >
                  <span className="text-gray-400 shrink-0">{TYPE_ICONS[r.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                  </div>
                  <span className="text-[10px] text-gray-300 shrink-0 capitalize">{r.type.replace("_", " ")}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : query.length >= 2 && !loading ? (
          <div className="py-10 text-center text-sm text-gray-400">No results for "{query}"</div>
        ) : query.length === 0 ? (
          <div className="py-6 px-4 text-center text-xs text-gray-400">
            Type to search across your jobs, CVs, and cover letters
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[9px] font-mono">↑↓</kbd> navigate
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[9px] font-mono">↵</kbd> select
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
