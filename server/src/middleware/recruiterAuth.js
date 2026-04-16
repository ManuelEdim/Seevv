import { supabase } from "../lib/supabase.js";

// Verifies the user is authenticated AND has role = 'recruiter' in profiles
const recruiterAuth = async (req, res, next) => {
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

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileErr || profile?.role !== "recruiter") {
      return res.status(403).json({ error: "Recruiter access only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Recruiter auth error:", err);
    return res.status(500).json({ error: "Authentication error" });
  }
};

export default recruiterAuth;
