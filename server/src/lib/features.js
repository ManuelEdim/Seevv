export const PLAN_HIERARCHY = ["free", "starter", "pro", "pro_plus"];

export const FEATURES = {
  decoder:         { minPlan: "free"     },
  cv_tailoring:    { minPlan: "free"     },
  cover_letter:    { minPlan: "free"     },
  pdf_export:      { minPlan: "free"     },
  voice_mirroring: { minPlan: "starter"  },
  gap_roadmap:     { minPlan: "starter"  },
  company_intel:   { minPlan: "starter"  },
  proof_of_work:   { minPlan: "starter"  },
  skills_graph:    { minPlan: "starter"  },
  transition_mode: { minPlan: "pro"      },
  speed_mode:      { minPlan: "pro"      },
  interview_prep:  { minPlan: "pro"      },
  mock_interview:  { minPlan: "pro"      },
  analytics:       { minPlan: "pro"      },
  verification:    { minPlan: "pro_plus" },
  recruiter_mode:  { minPlan: "pro_plus" },
  custom_branding: { minPlan: "pro_plus" },
  api_access:      { minPlan: "pro_plus" },
};

export const hasFeature = (plan, featureKey, overrides = {}) => {
  if (overrides[featureKey] === true)  return true;
  if (overrides[featureKey] === false) return false;
  const feature = FEATURES[featureKey];
  if (!feature) return true;
  const userIdx     = PLAN_HIERARCHY.indexOf(plan || "free");
  const requiredIdx = PLAN_HIERARCHY.indexOf(feature.minPlan);
  return userIdx >= requiredIdx;
};
