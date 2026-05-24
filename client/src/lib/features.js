// Feature definitions — single source of truth for plan gating
// Used by frontend hooks and admin dashboard

export const PLAN_HIERARCHY = ["free", "starter", "pro", "pro_plus"];

export const FEATURES = {
  decoder:         { label: "Deep Decoder",             minPlan: "free"     },
  cv_tailoring:    { label: "CV Tailoring",             minPlan: "free"     },
  cover_letter:    { label: "Cover Letters",            minPlan: "free"     },
  pdf_export:      { label: "PDF Export",               minPlan: "free"     },
  voice_mirroring: { label: "Voice Mirroring",          minPlan: "starter"  },
  gap_roadmap:     { label: "Gap-to-Goal Roadmap",      minPlan: "starter"  },
  company_intel:   { label: "Company Intelligence",     minPlan: "starter"  },
  proof_of_work:   { label: "Proof of Work",            minPlan: "starter"  },
  skills_graph:    { label: "Skills Graph",             minPlan: "starter"  },
  transition_mode: { label: "Industry Transition Mode", minPlan: "pro"      },
  speed_mode:      { label: "Speed Mode",               minPlan: "pro"      },
  interview_prep:  { label: "Interview Prep",           minPlan: "pro"      },
  mock_interview:  { label: "Mock Interview",           minPlan: "pro"      },
  analytics:       { label: "Application Analytics",   minPlan: "pro"      },
  verification:       { label: "Verification Badge",       minPlan: "pro_plus" },
  recruiter_mode:     { label: "Recruiter Profile",        minPlan: "pro_plus" },
  custom_branding:    { label: "Custom Branding",          minPlan: "pro_plus" },
  api_access:         { label: "API Access",               minPlan: "pro_plus" },
  rejection_intel:    { label: "Rejection Intelligence",   minPlan: "starter"  },
  negotiation_coach:  { label: "Negotiation Coach",        minPlan: "pro"      },
  recruiter_outreach: { label: "Recruiter Outreach",       minPlan: "pro"      },
  apply_assist:       { label: "Apply Assist",             minPlan: "pro"      },
};

export const PLAN_LABELS = {
  free:     "Free",
  starter:  "Starter",
  pro:      "Pro",
  pro_plus: "Pro+",
};

export const ROLE_LABELS = {
  user:      "Job Seeker",
  recruiter: "Recruiter",
  admin:     "Admin",
};

// Returns true if user's plan + overrides grants access to a feature
export const hasFeature = (plan, featureKey, overrides = {}) => {
  if (overrides[featureKey] === true)  return true;
  if (overrides[featureKey] === false) return false;
  const feature = FEATURES[featureKey];
  if (!feature) return true;
  const userIdx     = PLAN_HIERARCHY.indexOf(plan || "free");
  const requiredIdx = PLAN_HIERARCHY.indexOf(feature.minPlan);
  return userIdx >= requiredIdx;
};
