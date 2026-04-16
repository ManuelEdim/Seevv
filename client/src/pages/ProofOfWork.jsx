import { useState, useEffect, useCallback } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import api from "@/lib/api";

const PROOF_TYPES = [
  "GitHub / Code",
  "Portfolio / Website",
  "LinkedIn",
  "Certificate",
  "Case study",
  "Article / Publication",
  "Video / Demo",
  "Reference",
  "Other",
];

const sectionColor = {
  Experience:   "bg-brand-50 text-brand-700 border-brand-100",
  Projects:     "bg-teal-50 text-teal-700 border-teal-100",
  Skills:       "bg-amber-50 text-amber-700 border-amber-100",
  Achievements: "bg-coral-50 text-coral-700 border-coral-100",
  Education:    "bg-gray-100 text-gray-600 border-gray-200",
};

// ─── Claim card (extracted, not yet saved) ─────────────────
const ClaimCard = ({ claim, isSaved, onSave }) => {
  const [open, setOpen] = useState(false);
  const [proofType, setProofType] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      claim: claim.claim,
      proof_type: proofType,
      proof_url: proofUrl,
      proof_notes: proofNotes,
    });
    setIsSaving(false);
    setOpen(false);
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-card p-4 space-y-3 ${isSaved ? "border-teal-200 opacity-60" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${sectionColor[claim.section] || sectionColor.Skills}`}>
              {claim.section}
            </span>
            {isSaved && (
              <span className="text-[10px] font-semibold text-teal-700 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Backed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-900 font-medium leading-relaxed">{claim.claim}</p>
        </div>
      </div>

      {claim.proof_suggestion && (
        <p className="text-xs text-gray-400 italic">
          Suggested proof: {claim.proof_suggestion}
        </p>
      )}

      {!isSaved && (
        <>
          {!open ? (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              + Add proof link
            </Button>
          ) : (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proof type</label>
                <select
                  value={proofType}
                  onChange={(e) => setProofType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">Select type…</option>
                  {PROOF_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL (optional)</label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://github.com/you/project"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Ask Jane Smith to confirm, see case study doc in Drive…"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
                  Save evidence
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Evidence library item ─────────────────────────────────
const EvidenceItem = ({ item, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [proofType, setProofType] = useState(item.proof_type || "");
  const [proofUrl, setProofUrl] = useState(item.proof_url || "");
  const [proofNotes, setProofNotes] = useState(item.proof_notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    setIsSaving(true);
    await onUpdate(item.id, { proof_type: proofType, proof_url: proofUrl, proof_notes: proofNotes });
    setIsSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-900 font-medium leading-relaxed flex-1">{item.claim}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs text-coral-400 hover:text-coral-600 cursor-pointer transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="flex flex-wrap gap-2">
          {item.proof_type && (
            <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-100 font-medium">
              {item.proof_type}
            </span>
          )}
          {item.proof_url && (
            <a
              href={item.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline truncate max-w-xs"
            >
              {item.proof_url}
            </a>
          )}
          {item.proof_notes && (
            <p className="text-xs text-gray-400 italic w-full">{item.proof_notes}</p>
          )}
          {!item.proof_type && !item.proof_url && !item.proof_notes && (
            <p className="text-xs text-gray-300 italic">No proof added yet</p>
          )}
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <select
            value={proofType}
            onChange={(e) => setProofType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="">Select type…</option>
            {PROOF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          <textarea
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleUpdate}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────
const ProofOfWork = () => {
  const [claims, setClaims] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(true);
  const [error, setError] = useState(null);

  const loadEvidence = useCallback(async () => {
    try {
      const data = await api.get("/proof-of-work");
      setEvidence(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEvidence(false);
    }
  }, []);

  useEffect(() => { loadEvidence(); }, [loadEvidence]);

  const handleExtract = async () => {
    setError(null);
    setIsExtracting(true);
    try {
      const data = await api.post("/proof-of-work/extract");
      setClaims(Array.isArray(data) ? data : data.claims || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async (payload) => {
    try {
      const saved = await api.post("/proof-of-work", payload);
      setEvidence((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/proof-of-work/${id}`);
      setEvidence((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      const updated = await api.patch(`/proof-of-work/${id}`, payload);
      setEvidence((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      setError(err.message);
    }
  };

  const savedClaims = new Set(evidence.map((e) => e.claim));

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">Proof of Work</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Back every claim on your CV with evidence — ready for interviews and reference checks.
        </p>
      </div>

      {/* Extract section */}
      <Card padding="md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Extract claims from your CV</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Seevv reads your active CV and surfaces the claims that interviewers will probe.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            isLoading={isExtracting}
            onClick={handleExtract}
          >
            {isExtracting ? "Extracting…" : claims ? "Re-extract" : "Extract claims"}
          </Button>
        </div>

        {isExtracting && (
          <div className="flex items-center gap-3 mt-4 py-4">
            <Spinner size="sm" />
            <p className="text-xs text-gray-500">Reading your CV…</p>
          </div>
        )}

        {claims && !isExtracting && (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {claims.length} claims found — add proof links to back them up
            </p>
            {claims.map((claim, i) => (
              <ClaimCard
                key={i}
                claim={claim}
                isSaved={savedClaims.has(claim.claim)}
                onSave={handleSave}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Evidence library */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Evidence library</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {evidence.length} claim{evidence.length !== 1 ? "s" : ""} backed
            </p>
          </div>
          {evidence.length > 0 && (
            <span className="text-xs px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100 font-semibold">
              {evidence.length} backed
            </span>
          )}
        </div>

        {isLoadingEvidence ? (
          <div className="flex items-center gap-3 py-6">
            <Spinner size="sm" />
            <p className="text-xs text-gray-400">Loading evidence…</p>
          </div>
        ) : evidence.length === 0 ? (
          <Card padding="md">
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">No evidence saved yet.</p>
              <p className="text-xs text-gray-300 mt-1">Extract claims above and add proof links to get started.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {evidence.map((item) => (
              <EvidenceItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-3">
          <p className="text-sm text-coral-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProofOfWork;
