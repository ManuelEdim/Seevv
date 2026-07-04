import { supabase } from "./supabase.js";
import { getApiKey, maskKey } from "./keyStore.js";

// ─── Email provider registry ────────────────────────────────
export const EMAIL_REGISTRY = {
  resend: {
    label: "Resend",
    dbKey: "resend_api_key",
    envKey: "RESEND_API_KEY",
    website: "resend.com",
  },
  sendgrid: {
    label: "SendGrid",
    dbKey: "sendgrid_api_key",
    envKey: "SENDGRID_API_KEY",
    website: "sendgrid.com",
  },
};

// ─── Settings cache (1 min TTL) ─────────────────────────────
let settingsCache = null;
let settingsCacheExpiry = 0;
const CACHE_TTL = 60_000;

async function getEmailSettings() {
  if (Date.now() < settingsCacheExpiry && settingsCache) return settingsCache;

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["email_provider", "email_enabled"]);

    const map = {};
    (data || []).forEach((row) => { map[row.key] = row.value; });

    settingsCache = {
      provider: map.email_provider || process.env.EMAIL_PROVIDER || "resend",
      enabled: map.email_enabled !== "false",
    };
  } catch {
    settingsCache = {
      provider: process.env.EMAIL_PROVIDER || "resend",
      enabled: true,
    };
  }

  settingsCacheExpiry = Date.now() + CACHE_TTL;
  return settingsCache;
}

export function invalidateEmailCache() {
  settingsCache = null;
  settingsCacheExpiry = 0;
  cachedProvider = null;
  cachedProviderName = null;
}

// ─── Provider factory ───────────────────────────────────────
let cachedProvider = null;
let cachedProviderName = null;

const ADAPTERS = {
  resend:   () => import("./email/resend.js"),
  sendgrid: () => import("./email/sendgrid.js"),
};

export async function getEmailProvider() {
  const settings = await getEmailSettings();
  const name = settings.provider;

  if (cachedProvider && cachedProviderName === name) return cachedProvider;

  const registry = EMAIL_REGISTRY[name];
  if (!registry) throw new Error(`Unknown email provider: ${name}`);

  const apiKey = await getApiKey(registry.dbKey, registry.envKey);
  if (!apiKey) {
    throw new Error(
      `No API key configured for ${registry.label}. Add it in Admin → Integrations.`,
    );
  }

  const loader = ADAPTERS[name];
  if (!loader) throw new Error(`No adapter for email provider: ${name}`);

  const mod = await loader();
  cachedProvider = new mod.default(apiKey);
  cachedProviderName = name;
  return cachedProvider;
}

export async function isEmailEnabled() {
  const settings = await getEmailSettings();
  return settings.enabled;
}

export async function getActiveEmailProviderName() {
  const settings = await getEmailSettings();
  return settings.provider;
}

// ─── Status for admin panel (async — reads keys from DB) ────
export async function getEmailProviderStatus() {
  const status = {};
  await Promise.all(
    Object.entries(EMAIL_REGISTRY).map(async ([id, config]) => {
      const key = await getApiKey(config.dbKey, config.envKey);
      status[id] = {
        label: config.label,
        website: config.website,
        configured: !!key,
        keyPreview: maskKey(key),
        dbKey: config.dbKey,
      };
    }),
  );
  return status;
}
