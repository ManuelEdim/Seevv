const BASE = "https://api.paystack.co";

export default class PaystackProvider {
  static id = "paystack";
  static label = "Paystack";
  static flow = "popup";

  constructor(secretKey) {
    this.secretKey = secretKey;
  }

  #headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  // Returns { authorization_url, access_code, reference, flow: "popup" }
  async initialize({ email, amount, currency, reference, metadata }) {
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: "POST",
      headers: this.#headers(),
      body: JSON.stringify({ email, amount, currency, reference, metadata }),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.message || "Failed to initialize Paystack payment");
    return {
      flow: "popup",
      authorization_url: json.data.authorization_url,
      access_code: json.data.access_code,
      reference: json.data.reference,
    };
  }

  // Returns { success, amount, currency, paid_at, metadata }
  async verify(reference) {
    const res = await fetch(`${BASE}/transaction/verify/${reference}`, {
      headers: this.#headers(),
    });
    const json = await res.json();
    if (!json.status || json.data?.status !== "success") {
      throw new Error(json.data?.gateway_response || json.message || "Payment not verified");
    }
    return {
      success: true,
      amount: json.data.amount,
      currency: json.data.currency,
      paid_at: json.data.paid_at,
      metadata: json.data.metadata || {},
    };
  }
}
