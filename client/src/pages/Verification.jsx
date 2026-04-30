import { useState, useEffect } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import FeatureGate from "@/components/FeatureGate";

const BADGE_TYPES = [
  {
    key: "identity",
    label: "Identity Verified",
    desc: "Your identity has been confirmed via document verification.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    color: "teal",
  },
  {
    key: "employment",
    label: "Employment Verified",
    desc: "Past or current employment has been independently verified.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    color: "brand",
  },
  {
    key: "education",
    label: "Education Verified",
    desc: "Academic qualifications have been confirmed with the institution.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    color: "amber",
  },
  {
    key: "skills",
    label: "Skills Assessed",
    desc: "Technical and professional skills validated through Seevv assessment.",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    color: "purple",
  },
];

const colorMap = {
  teal: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-500",
    badge: "bg-teal-100 text-teal-800",
  },
  brand: {
    bg: "bg-brand-50",
    border: "border-brand-200",
    text: "text-brand-700",
    dot: "bg-brand-500",
    badge: "bg-brand-100 text-brand-800",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-800",
  },
};

const BadgeCard = ({ badge, verifiedAt, onRequest, requesting }) => {
  const c = colorMap[badge.color];
  const isVerified = !!verifiedAt;

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${isVerified ? `${c.border} ${c.bg}` : "border-gray-100 bg-white"}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVerified ? c.bg : "bg-gray-100"}`}
        >
          <span className={isVerified ? c.text : "text-gray-400"}>
            {badge.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-bold text-gray-900">{badge.label}</p>
            {isVerified && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}
              >
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{badge.desc}</p>
          {isVerified && verifiedAt && (
            <p className="text-[10px] text-gray-400 mt-1.5">
              Verified{" "}
              {new Date(verifiedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
      {!isVerified && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequest(badge.key)}
            isLoading={requesting === badge.key}
          >
            Request verification
          </Button>
        </div>
      )}
    </div>
  );
};

const VerificationPage = () => {
  const user = useAuthStore((s) => s.user);
  const [badges, setBadges] = useState({});
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("verification_badges")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Column may not exist yet — treat as empty
          setBadges({});
        } else {
          setBadges(data?.verification_badges || {});
        }
        setLoading(false);
      })
      .catch(() => {
        setBadges({});
        setLoading(false);
      });
  }, [user]);

  const handleRequest = async (badgeKey) => {
    setRequesting(badgeKey);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post("/verification/request", { badgeType: badgeKey });
      setSuccessMsg(
        `Verification request submitted for ${BADGE_TYPES.find((b) => b.key === badgeKey)?.label}. Our team will review it within 2–3 business days.`,
      );
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setRequesting(null);
    }
  };

  const verifiedCount = Object.values(badges).filter(Boolean).length;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className=" mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Verification Badges
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Add credibility to your profile with verified credentials.
          </p>
        </div>
        {verifiedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-full">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-xs font-bold text-teal-700">
              {verifiedCount} verified
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
          {successMsg}
        </div>
      )}

      {/* Trust score */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
            Trust score
          </p>
          <span className="text-sm font-bold text-gray-900">
            {verifiedCount}/{BADGE_TYPES.length}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-linear-to-r from-brand-600 to-teal-500 transition-all duration-700"
            style={{ width: `${(verifiedCount / BADGE_TYPES.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          {verifiedCount === 0
            ? "Start verifying your credentials to build recruiter trust."
            : verifiedCount === BADGE_TYPES.length
              ? "Fully verified — maximum trust signal for recruiters."
              : `${BADGE_TYPES.length - verifiedCount} more badge${BADGE_TYPES.length - verifiedCount !== 1 ? "s" : ""} available.`}
        </p>
      </Card>

      {/* Badge grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BADGE_TYPES.map((badge) => (
          <BadgeCard
            key={badge.key}
            badge={badge}
            verifiedAt={badges[badge.key]}
            onRequest={handleRequest}
            requesting={requesting}
          />
        ))}
      </div>

      {/* How it works */}
      <Card padding="md">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">
          How verification works
        </p>
        <ol className="space-y-3">
          {[
            'Click "Request verification" on any badge you\'d like to earn.',
            "Our team reaches out with a simple document request (e.g. payslip, degree certificate).",
            "Once confirmed, the badge appears on your profile and CV exports.",
            "Recruiters and hiring managers can see your verified status instantly.",
          ].map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-xs text-gray-600"
            >
              <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 font-bold text-[9px] mt-0.5">
                {i + 1}
              </div>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
};

const VerificationGated = () => (
  <FeatureGate feature="verification">
    <VerificationPage />
  </FeatureGate>
);
export default VerificationGated;
