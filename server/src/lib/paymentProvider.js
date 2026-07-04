import { supabase } from "./supabase.js";
import { getApiKey, maskKey } from "./keyStore.js";

// ─── Gateway registry ───────────────────────────────────────
export const PAYMENT_REGISTRY = {
  paystack: {
    label: "Paystack",
    dbKey: "paystack_secret_key",
    envKey: "PAYSTACK_SECRET_KEY",
    currencies: ["NGN", "USD", "GBP"],
    regions: "Africa-focused (Nigeria, Ghana, Kenya, South Africa)",
    flow: "popup",
  },
  stripe: {
    label: "Stripe",
    dbKey: "stripe_secret_key",
    envKey: "STRIPE_SECRET_KEY",
    currencies: ["USD", "GBP", "EUR"],
    regions: "International (most countries)",
    flow: "redirect",
  },
  flutterwave: {
    label: "Flutterwave",
    dbKey: "flutterwave_secret_key",
    envKey: "FLUTTERWAVE_SECRET_KEY",
    currencies: ["NGN", "USD", "GBP", "GHS", "KES", "ZAR"],
    regions: "Pan-African + International",
    flow: "redirect",
  },
};

// ─── Settings cache (1 min TTL) ─────────────────────────────
let settingsCache = null;
let settingsCacheExpiry = 0;
const CACHE_TTL = 60_000;

async function getPaymentSettings() {
  if (Date.now() < settingsCacheExpiry && settingsCache) return settingsCache;

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["payment_gateway", "payment_enabled"]);

    const map = {};
    (data || []).forEach((row) => { map[row.key] = row.value; });

    settingsCache = {
      gateway: map.payment_gateway || process.env.PAYMENT_GATEWAY || "paystack",
      enabled: map.payment_enabled !== "false",
    };
  } catch {
    settingsCache = {
      gateway: process.env.PAYMENT_GATEWAY || "paystack",
      enabled: true,
    };
  }

  settingsCacheExpiry = Date.now() + CACHE_TTL;
  return settingsCache;
}

export function invalidatePaymentCache() {
  settingsCache = null;
  settingsCacheExpiry = 0;
  cachedProvider = null;
  cachedProviderName = null;
}

// ─── Provider factory ───────────────────────────────────────
let cachedProvider = null;
let cachedProviderName = null;

const ADAPTERS = {
  paystack:    () => import("./payments/paystack.js"),
  stripe:      () => import("./payments/stripe.js"),
  flutterwave: () => import("./payments/flutterwave.js"),
};

export async function getPaymentProvider() {
  const settings = await getPaymentSettings();

  if (!settings.enabled) {
    throw new Error("Payments are currently disabled by the administrator.");
  }

  const name = settings.gateway;
  if (cachedProvider && cachedProviderName === name) return cachedProvider;

  const registry = PAYMENT_REGISTRY[name];
  if (!registry) throw new Error(`Unknown payment gateway: ${name}`);

  const apiKey = await getApiKey(registry.dbKey, registry.envKey);
  if (!apiKey) {
    throw new Error(
      `No API key configured for ${registry.label}. Add it in Admin → Payment Gateway.`,
    );
  }

  const loader = ADAPTERS[name];
  if (!loader) throw new Error(`No adapter for gateway: ${name}`);

  try {
    const mod = await loader();
    cachedProvider = new mod.default(apiKey);
    cachedProviderName = name;
    return cachedProvider;
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error(`SDK for ${registry.label} is not installed. Run: npm install stripe`);
    }
    throw err;
  }
}

export async function isPaymentEnabled() {
  const settings = await getPaymentSettings();
  return settings.enabled;
}

export async function getActiveGatewayName() {
  const settings = await getPaymentSettings();
  return settings.gateway;
}

export async function getActiveGatewayFlow() {
  const settings = await getPaymentSettings();
  return PAYMENT_REGISTRY[settings.gateway]?.flow || "redirect";
}

// ─── Status for admin panel (async — reads keys from DB) ────
export async function getPaymentGatewayStatus() {
  const status = {};
  await Promise.all(
    Object.entries(PAYMENT_REGISTRY).map(async ([id, config]) => {
      const key = await getApiKey(config.dbKey, config.envKey);
      status[id] = {
        label: config.label,
        currencies: config.currencies,
        regions: config.regions,
        flow: config.flow,
        configured: !!key,
        keyPreview: maskKey(key),
        dbKey: config.dbKey,
      };
    }),
  );
  return status;
}
