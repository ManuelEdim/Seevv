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

const ApiAccessGated = () => (
  <FeatureGate feature="api_access">
    <ApiAccessPage />
  </FeatureGate>
);
export default ApiAccessGated;
