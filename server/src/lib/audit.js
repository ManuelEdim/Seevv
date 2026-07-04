import { supabase } from "./supabase.js";

export async function logAudit(adminId, action, targetType, targetId, details = {}) {
  try {
    await supabase.from("audit_logs").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: String(targetId || ""),
      details,
    });
  } catch (err) {
    // Never let audit logging break the main flow
    console.error("Audit log failed:", err.message);
  }
}
