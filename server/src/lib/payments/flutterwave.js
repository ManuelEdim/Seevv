const BASE = "https://api.flutterwave.com/v3";

export default class FlutterwaveProvider {
  static id = "flutterwave";
  static label = "Flutterwave";
  static flow = "redirect";

  constructor(secretKey) {
    this.secretKey = secretKey;
  }

  #headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  // Returns { authorization_url, reference, flow: "redirect" }
  // Flutterwave expects amount in major currency units (not smallest unit)
  async initialize({ email, name, amount, currency, reference, metadata, callbackUrl }) {
    const res = await fetch(`${BASE}/payments`, {
      method: "POST",
      headers: this.#headers(),
      body: JSON.stringify({
        tx_ref: reference,
        amount: amount / 100, // convert from smallest unit (kobo/cents) to major unit
        currency,
        redirect_url: callbackUrl,
        customer: { email, name: name || "" },
        customizations: {
          title: "Seevv",
          description: metadata.plan_name || "Seevv Plan",
        },
        meta: metadata,
      }),
    });
    const json = await res.json();
    if (json.status !== "success") {
      throw new Error(json.message || "Failed to initialize Flutterwave payment");
    }
    return {
      flow: "redirect",
      authorization_url: json.data.link,
      access_code: null,
      reference, // our tx_ref — Flutterwave returns it in the redirect URL as ?tx_ref=
    };
  }

  // reference = tx_ref we sent during initialize
  async verify(reference) {
    const res = await fetch(
      `${BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: this.#headers() },
    );
    const json = await res.json();
    if (json.status !== "success" || json.data?.status !== "successful") {
      throw new Error(json.message || "Payment not verified");
    }
    return {
      success: true,
      amount: Math.round(json.data.amount * 100), // convert back to smallest unit
      currency: json.data.currency,
      paid_at: json.data.created_at,
      metadata: json.data.meta || {},
    };
  }
}
