import { useState, useEffect } from "react";
import { Button, Card } from "@/components/ui";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

const CODE_EXAMPLES = {
  curl: (key) => `curl -X POST https://api.seevv.io/v1/cv/tailor \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"cvText": "...", "jobDescription": "..."}'`,
  js: (
    key,
  ) => `const response = await fetch("https://api.seevv.io/v1/cv/tailor", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ cvText: "...", jobDescription: "..." }),
});
const { tailored } = await response.json();`,
  python: (key) => `import requests

response = requests.post(
    "https://api.seevv.io/v1/cv/tailor",
    headers={"Authorization": f"Bearer ${key}"},
    json={"cvText": "...", "jobDescription": "..."},
)
data = response.json()`,
};

const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold text-brand-600 hover:text-brand-800 cursor-pointer"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
};

const ApiAccessPage = () => {
  const [keyInfo, setKeyInfo] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState("curl");
  const [showRevoke, setShowRevoke] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api-access");
      setKeyInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post("/api-access/generate");
      setNewKey(data.key);
      setKeyInfo({
        hasKey: true,
        keyPreview: `${data.key.slice(0, 14)}••••••••••••••••`,
        createdAt: data.createdAt,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await api.delete("/api-access");
      setKeyInfo({ hasKey: false, keyPreview: null, createdAt: null });
      setNewKey(null);
      setShowRevoke(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  };

  const displayKey =
    newKey ||
    keyInfo?.keyPreview ||
    "seevv_••••••••••••••••••••••••••••••••••••••••••••••••";

  return (
    <div className=" mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-lg font-bold text-gray-900">API Access</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Integrate Seevv's AI directly into your own tools and workflows.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Key card */}
      <Card padding="md">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">API Key</p>
              {keyInfo?.createdAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Created {new Date(keyInfo.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {keyInfo?.hasKey && (
                <button
                  onClick={() => setShowRevoke(true)}
                  className="text-xs text-red-400 hover:text-red-600 cursor-pointer font-semibold"
                >
                  Revoke
                </button>
              )}
              <Button
                variant="primary"
                size="sm"
                isLoading={generating}
                onClick={handleGenerate}
              >
                {keyInfo?.hasKey ? "Rotate key" : "Generate key"}
              </Button>
            </div>
          </div>

          {/* Key display */}
          <div className="flex items-center gap-3 bg-gray-950 rounded-xl px-4 py-3 font-mono">
            <span className="flex-1 text-xs text-green-400 tracking-wide truncate">
              {displayKey}
            </span>
            {newKey && <CopyButton text={newKey} />}
          </div>

          {newKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800 font-semibold">
                Copy your key now — it won't be shown again after you leave this
                page.
              </p>
            </div>
          )}

          {!keyInfo?.hasKey && !loading && (
            <p className="text-xs text-gray-400 text-center">
              No key generated yet. Click "Generate key" to create one.
            </p>
          )}
        </div>
      </Card>

      {/* Code examples */}
      <Card padding="md">
        <p className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-widest">
          Example usage
        </p>
        <div className="flex gap-2 mb-4">
          {Object.keys(CODE_EXAMPLES).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                lang === l
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="relative bg-gray-950 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs text-green-300 leading-relaxed whitespace-pre">
            {CODE_EXAMPLES[lang](displayKey)}
          </pre>
          <div className="absolute top-3 right-3">
            <CopyButton
              text={CODE_EXAMPLES[lang](displayKey)}
              label="Copy code"
            />
          </div>
        </div>
      </Card>

      {/* Available endpoints */}
      <Card padding="md">
        <p className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-widest">
          Available endpoints
        </p>
        <div className="space-y-3">
          {[
            {
              method: "POST",
              path: "/v1/cv/tailor",
              desc: "Tailor a CV to a job description",
            },
            {
              method: "POST",
              path: "/v1/cv/blind-spots",
              desc: "Detect blind spots in a CV",
            },
            {
              method: "POST",
              path: "/v1/cover-letter",
              desc: "Generate a cover letter",
            },
            {
              method: "POST",
              path: "/v1/interview/prep",
              desc: "Generate interview questions",
            },
            {
              method: "POST",
              path: "/v1/gap-analysis",
              desc: "Analyse skill gaps for a role",
            },
          ].map((ep) => (
            <div
              key={ep.path}
              className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ep.method === "POST"
                    ? "bg-teal-50 text-teal-700"
                    : "bg-brand-50 text-brand-700"
                }`}
              >
                {ep.method}
              </span>
              <span className="text-xs font-mono text-gray-700 flex-1">
                {ep.path}
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                {ep.desc}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-4">
          Full API documentation at{" "}
          <span className="text-brand-600 font-semibold">
            seevv.io/docs/api
          </span>
        </p>
      </Card>

      {/* Revoke confirm */}
      {showRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="font-bold text-gray-900 mb-2">Revoke API key?</p>
            <p className="text-sm text-gray-400 mb-6">
              Any integrations using this key will stop working immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 cursor-pointer disabled:opacity-50"
              >
                {revoking ? "Revoking…" : "Revoke key"}
              </button>
              <button
                onClick={() => setShowRevoke(false)}
                className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Webhooks section ─────────────────────────────────────
const WEBHOOK_EVENTS = [
  "cv.updated", "cv_version.created", "job.applied",
  "job.status_changed", "interview.scheduled",
  "verification.approved", "verification.rejected",
];

const WebhooksSection = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState(["cv_version.created"]);
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const load = () => {
    api.get("/webhooks").then((d) => setWebhooks(d.webhooks || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!newUrl.trim() || !newEvents.length) return;
    setCreating(true);
    try {
      const created = await api.post("/webhooks", { url: newUrl.trim(), events: newEvents });
      setWebhooks((prev) => [created, ...prev]);
      setNewUrl(""); setNewEvents(["cv_version.created"]); setShowForm(false);
    } catch (err) { alert(err.message); } finally { setCreating(false); }
  };

  const remove = async (id) => {
    await api.delete(`/webhooks/${id}`).catch(() => {});
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const test = async (id) => {
    setTestingId(id);
    try {
      const r = await api.post(`/webhooks/${id}/test`);
      setTestResult({ id, ok: r.success, status: r.statusCode });
    } catch { setTestResult({ id, ok: false }); } finally { setTestingId(null); }
    setTimeout(() => setTestResult(null), 5000);
  };

  const toggleEvent = (e) => setNewEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  return (
    <Card padding="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Webhooks</p>
            <p className="text-xs text-gray-400 mt-0.5">Get notified in real-time when events happen in your Seevv account</p>
          </div>
          <button onClick={() => setShowForm((p) => !p)} className="text-xs font-semibold text-brand-600 hover:text-brand-800 cursor-pointer">
            {showForm ? "Cancel" : "+ Add webhook"}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((e) => (
                <button key={e} onClick={() => toggleEvent(e)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${newEvents.includes(e) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"}`}
                >{e}</button>
              ))}
            </div>
            <button onClick={create} disabled={creating || !newUrl.trim() || !newEvents.length}
              className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-brand-800 disabled:opacity-50"
            >{creating ? "Creating…" : "Create webhook"}</button>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-gray-400 py-4 text-center">Loading webhooks…</p>
        ) : webhooks.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No webhooks configured yet</p>
        ) : (
          <div className="space-y-3">
            {webhooks.map((w) => (
              <div key={w.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{w.url}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex flex-wrap gap-1">
                    {(w.events || []).map((e) => <span key={e} className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{e}</span>)}
                  </p>
                  {testResult?.id === w.id && (
                    <p className={`text-[10px] mt-1 font-semibold ${testResult.ok ? "text-teal-600" : "text-red-500"}`}>
                      {testResult.ok ? `✓ Test delivered (HTTP ${testResult.status})` : "✗ Delivery failed"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => test(w.id)} disabled={testingId === w.id}
                    className="text-[10px] text-gray-500 hover:text-brand-600 cursor-pointer font-medium disabled:opacity-50"
                  >{testingId === w.id ? "Testing…" : "Test"}</button>
                  <button onClick={() => remove(w.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── CV share section ─────────────────────────────────────
const CvShareSection = () => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/cv-review/my").then((d) => setShares(d.shares || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const revoke = async (id) => {
    await api.delete(`/cv-review/${id}`).catch(() => {});
    setShares((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <Card padding="md">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-900">CV Share Links</p>
          <p className="text-xs text-gray-400 mt-0.5">Public review links for your CVs — manage from your CV Manager</p>
        </div>
        {loading ? (
          <p className="text-xs text-gray-400 py-4 text-center">Loading shares…</p>
        ) : shares.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No active share links. Create one from CV Manager.</p>
        ) : (
          <div className="space-y-3">
            {shares.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{s.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {s.view_count || 0} views · {(s.comments?.[0]?.count ?? s.comments?.length ?? 0)} comments
                    {s.expires_at && ` · expires ${new Date(s.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/review/${s.token}`); }}
                    className="text-[10px] text-brand-600 hover:text-brand-800 cursor-pointer font-medium"
                  >Copy link</button>
                  <button onClick={() => revoke(s.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

const ApiAccessInner = () => (
  <div className="space-y-6 pb-10">
    <ApiAccessPage />
    <WebhooksSection />
    <CvShareSection />
  </div>
);

const ApiAccessGated = () => (
  <FeatureGate feature="api_access">
    <ApiAccessInner />
  </FeatureGate>
);
export default ApiAccessGated;
