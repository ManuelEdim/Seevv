import { useState, useEffect } from "react";
import { Button, Card } from "@/components/ui";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

const PRESET_COLORS = [
  { label: "Seevv Navy", value: "#033876" },
  { label: "Midnight", value: "#1a1a2e" },
  { label: "Forest", value: "#1B4332" },
  { label: "Burgundy", value: "#7B1D1D" },
  { label: "Slate", value: "#334155" },
  { label: "Indigo", value: "#3730a3" },
  { label: "Teal", value: "#0f766e" },
  { label: "Graphite", value: "#374151" },
];

const HEADER_STYLES = [
  { value: "classic", label: "Classic", desc: "Centered name, contact below" },
  { value: "modern", label: "Modern", desc: "Name left-aligned, colored bar" },
  { value: "minimal", label: "Minimal", desc: "Clean, no header background" },
];

const FONT_STYLES = [
  {
    value: "professional",
    label: "Professional",
    desc: "Arial — clean and ATS-safe",
  },
  {
    value: "elegant",
    label: "Elegant",
    desc: "Georgia — serif, distinguished",
  },
  { value: "modern", label: "Modern", desc: "Calibri — contemporary feel" },
];

// Live mini CV preview
const CVPreview = ({ color, headerStyle, fontStyle }) => {
  const fontMap = {
    professional: "Arial, sans-serif",
    elegant: "Georgia, serif",
    modern: "Calibri, sans-serif",
  };
  const font = fontMap[fontStyle] || fontMap.professional;

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ fontFamily: font, fontSize: "7px", lineHeight: 1.4 }}
    >
      {/* Header */}
      {headerStyle === "classic" && (
        <div
          style={{
            background: color,
            color: "white",
            padding: "10px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: 2 }}>
            Your Name
          </div>
          <div style={{ opacity: 0.75, fontSize: "6px" }}>
            email@example.com · +44 7700 000000 · London
          </div>
        </div>
      )}
      {headerStyle === "modern" && (
        <div
          style={{
            borderLeft: `4px solid ${color}`,
            padding: "10px 12px",
            background: "#f9fafb",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color }}>
            {" "}
            Your Name
          </div>
          <div style={{ color: "#6b7280", fontSize: "6px", marginTop: 2 }}>
            email@example.com · +44 7700 000000
          </div>
        </div>
      )}
      {headerStyle === "minimal" && (
        <div
          style={{ padding: "10px 12px", borderBottom: `2px solid ${color}` }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#111" }}>
            Your Name
          </div>
          <div style={{ color: "#6b7280", fontSize: "6px", marginTop: 1 }}>
            email@example.com · London
          </div>
        </div>
      )}
      {/* Body */}
      <div style={{ padding: "8px 12px", background: "white", space: "4px" }}>
        <div
          style={{
            color,
            fontWeight: 700,
            fontSize: "7px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: `1px solid ${color}`,
            paddingBottom: 2,
            marginBottom: 4,
          }}
        >
          Summary
        </div>
        <div style={{ color: "#374151", marginBottom: 6 }}>
          Experienced professional with a track record of delivering results in
          fast-paced environments.
        </div>
        <div
          style={{
            color,
            fontWeight: 700,
            fontSize: "7px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: `1px solid ${color}`,
            paddingBottom: 2,
            marginBottom: 4,
          }}
        >
          Experience
        </div>
        <div style={{ color: "#111", fontWeight: 600, marginBottom: 1 }}>
          Senior Manager · Acme Corp
        </div>
        <div style={{ color: "#6b7280", marginBottom: 2 }}>
          Jan 2021 – Present
        </div>
        <div style={{ color: "#374151" }}>
          • Led cross-functional team of 12 to deliver £2M project on time.
        </div>
      </div>
    </div>
  );
};

const CustomBrandingPage = () => {
  const [branding, setBranding] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/branding")
      .then((d) => setBranding(d.branding))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const d = await api.patch("/branding", branding);
      setBranding(d.branding);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const d = await api.post("/branding/reset");
      setBranding(d.branding);
      setSaved(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className=" mx-auto space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Custom Branding</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Personalise the look of your exported PDF CVs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={saving}
            onClick={handleSave}
          >
            {saved ? "✓ Saved" : "Save branding"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-5">
          {/* Accent colour */}
          <Card padding="md">
            <p className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-widest">
              Accent colour
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => update("accentColor", c.value)}
                  title={c.label}
                  className={`w-full aspect-square rounded-xl border-2 transition-all cursor-pointer ${
                    branding?.accentColor === c.value
                      ? "border-gray-900 scale-105 shadow-md"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 font-medium">
                Custom hex
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={branding?.accentColor || "#033876"}
                  onChange={(e) => update("accentColor", e.target.value)}
                  className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding?.accentColor || ""}
                  onChange={(e) => update("accentColor", e.target.value)}
                  placeholder="#033876"
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>
          </Card>

          {/* Header style */}
          <Card padding="md">
            <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
              Header style
            </p>
            <div className="space-y-2">
              {HEADER_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => update("headerStyle", s.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    branding?.headerStyle === s.value
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${branding?.headerStyle === s.value ? "bg-brand-600 border-brand-600" : "border-gray-300"}`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Font style */}
          <Card padding="md">
            <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
              Font style
            </p>
            <div className="space-y-2">
              {FONT_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => update("fontStyle", s.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    branding?.fontStyle === s.value
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${branding?.fontStyle === s.value ? "bg-brand-600 border-brand-600" : "border-gray-300"}`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
            Live preview
          </p>
          {branding && (
            <CVPreview
              color={branding.accentColor || "#033876"}
              headerStyle={branding.headerStyle || "classic"}
              fontStyle={branding.fontStyle || "professional"}
            />
          )}
          <p className="text-[10px] text-gray-400 text-center">
            Preview is approximate — exported PDFs may vary slightly.
          </p>
        </div>
      </div>
    </div>
  );
};

const CustomBrandingGated = () => (
  <FeatureGate feature="custom_branding">
    <CustomBrandingPage />
  </FeatureGate>
);
export default CustomBrandingGated;
