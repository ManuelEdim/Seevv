import useAuthStore from "@/store/authStore";
import { hasFeature, PLAN_HIERARCHY, PLAN_LABELS, FEATURES } from "@/lib/features";

const useFeatureAccess = (featureKey) => {
  const profile = useAuthStore((s) => s.profile);
  const plan = profile?.plan || "free";
  const overrides = profile?.feature_overrides || {};
  const role = profile?.role || "user";

  const allowed = role === "admin" || hasFeature(plan, featureKey, overrides);

  const feature = FEATURES[featureKey];
  const requiredPlan = feature?.minPlan || "free";
  const requiredLabel = PLAN_LABELS[requiredPlan] || requiredPlan;

  return { allowed, plan, role, requiredPlan, requiredLabel };
};

export default useFeatureAccess;
