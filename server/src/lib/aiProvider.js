import { supabase } from "./supabase.js";
import { getApiKey, maskKey } from "./keyStore.js";

// ─── Provider registry ─────────────────────────────────────
export const PROVIDER_REGISTRY = {
  gemini: {
    label: "Google Gemini",
    dbKey: "gemini_api_key",
    envKey: "GEMINI_API_KEY",
    models: { flash: "gemini-2.5-flash", pro: "gemini-2.5-flash" },
  },
  openai: {
    label: "OpenAI",
    dbKey: "openai_api_key",
    envKey: "OPENAI_API_KEY",
    models: { flash: "gpt-4o-mini", pro: "gpt-4o" },
  },
  anthropic: {
    label: "Anthropic Claude",
    dbKey: "anthropic_api_key",
    envKey: "ANTHROPIC_API_KEY",
    models: { flash: "claude-haiku-4-5-20251001", pro: "claude-sonnet-4-6" },
  },
  mistral: {
    label: "Mistral AI",
    dbKey: "mistral_api_key",
    envKey: "MISTRAL_API_KEY",
    models: { flash: "mistral-small-latest", pro: "mistral-large-latest" },
  },
};

// ─── Settings cache ─────────────────────────────────────────
let settingsCache = null;
let settingsCacheExpiry = 0;
const CACHE_TTL = 60_000;

async function getAISettings() {
  if (Date.now() < settingsCacheExpiry && settingsCache) return settingsCache;

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["ai_provider", "ai_enabled"]);

    const map = {};
    (data || []).forEach((row) => { map[row.key] = row.value; });

    settingsCache = {
      provider: map.ai_provider || process.env.AI_PROVIDER || "gemini",
      enabled: map.ai_enabled !== "false",
    };
  } catch {
    settingsCache = {
      provider: process.env.AI_PROVIDER || "gemini",
      enabled: true,
    };
  }

  settingsCacheExpiry = Date.now() + CACHE_TTL;
  return settingsCache;
}

export function invalidateCache() {
  settingsCache = null;
  settingsCacheExpiry = 0;
  cachedProvider = null;
  cachedProviderName = null;
}

// ─── Provider factory ───────────────────────────────────────
let cachedProvider = null;
let cachedProviderName = null;

const ADAPTERS = {
  gemini:    () => import("./providers/gemini.js"),
  openai:    () => import("./providers/openai.js"),
  anthropic: () => import("./providers/anthropic.js"),
  mistral:   () => import("./providers/mistral.js"),
};

export async function getProvider() {
  const settings = await getAISettings();

  if (!settings.enabled) {
    throw new Error("AI features are currently disabled by the administrator.");
  }

  const name = settings.provider;

  if (cachedProvider && cachedProviderName === name) return cachedProvider;

  const registry = PROVIDER_REGISTRY[name];
  if (!registry) throw new Error(`Unknown AI provider: ${name}`);

  const apiKey = await getApiKey(registry.dbKey, registry.envKey);
  if (!apiKey) {
    throw new Error(
      `No API key configured for ${registry.label}. Add it in Admin → AI Configuration.`,
    );
  }

  const loader = ADAPTERS[name];
  if (!loader) throw new Error(`No adapter for provider: ${name}`);

  try {
    const mod = await loader();
    cachedProvider = new mod.default(apiKey);
    cachedProviderName = name;
    return cachedProvider;
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error(
        `SDK for ${registry.label} is not installed. Run: npm install ${name === "anthropic" ? "@anthropic-ai/sdk" : name === "mistral" ? "@mistralai/mistralai" : name}`,
      );
    }
    throw err;
  }
}

export async function isAIEnabled() {
  const settings = await getAISettings();
  return settings.enabled;
}

export async function getActiveProviderName() {
  const settings = await getAISettings();
  return settings.provider;
}

// ─── Status for admin panel (async — reads keys from DB) ────
export async function getProviderStatus() {
  const status = {};
  await Promise.all(
    Object.entries(PROVIDER_REGISTRY).map(async ([id, config]) => {
      const key = await getApiKey(config.dbKey, config.envKey);
      status[id] = {
        label: config.label,
        models: config.models,
        configured: !!key,
        keyPreview: maskKey(key),
        dbKey: config.dbKey,
      };
    }),
  );
  return status;
}
