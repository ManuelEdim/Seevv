import { supabase } from "../lib/supabase.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Enrich with profile (role, plan, feature_overrides)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, plan, plan_expires_at, feature_overrides, full_name")
      .eq("id", user.id)
      .single();

    req.user = {
      ...user,
      profile: profile || { role: "user", plan: "free", feature_overrides: {} },
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

export default authMiddleware;
