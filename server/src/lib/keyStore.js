import { supabase } from "./supabase.js";

// ─── Key cache (5-min TTL) ──────────────────────────────────
// Stores resolved API key values so we don't hammer the DB on every AI call
const keyCache = new Map(); // dbKey → { value, expiry }
const KEY_TTL = 5 * 60_000;

/**
 * Reads an API key: DB row first, env var fallback.
 * dbKey  — the app_settings.key name (e.g. "paystack_secret_key")
 * envKey — the env var name (e.g. "PAYSTACK_SECRET_KEY")
 */
export async function getApiKey(dbKey, envKey) {
  const cached = keyCache.get(dbKey);
  if (cached && Date.now() < cached.expiry) return cached.value;

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", dbKey)
      .maybeSingle();

    const value = data?.value || process.env[envKey] || null;
    keyCache.set(dbKey, { value, expiry: Date.now() + KEY_TTL });
    return value;
  } catch {
    const value = process.env[envKey] || null;
    keyCache.set(dbKey, { value, expiry: Date.now() + KEY_TTL });
    return value;
  }
}

/** Save a key to app_settings and evict the cache entry immediately. */
export async function saveApiKey(dbKey, value) {
  await supabase
    .from("app_settings")
    .upsert({ key: dbKey, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  keyCache.delete(dbKey);
}

/** Evict one key (or all keys if no argument). */
export function invalidateKeyCache(dbKey) {
  if (dbKey) keyCache.delete(dbKey);
  else keyCache.clear();
}

/** Returns the last-4 preview string, or null if no key is stored. */
export function maskKey(key) {
  if (!key) return null;
  return "••••" + key.slice(-4);
}
