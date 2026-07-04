import Stripe from "stripe";

export default class StripeProvider {
  static id = "stripe";
  static label = "Stripe";
  static flow = "redirect";

  constructor(secretKey) {
    this.client = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  }

  // Returns { authorization_url, reference, flow: "redirect" }
  // reference = Stripe checkout session ID
  async initialize({ email, amount, currency, reference, metadata, callbackUrl, cancelUrl }) {
    const session = await this.client.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: metadata.plan_name || "Seevv Plan",
              description: "Seevv AI Career Platform",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // {CHECKOUT_SESSION_ID} is replaced by Stripe at redirect time
      success_url: `${callbackUrl}?ref={CHECKOUT_SESSION_ID}&gateway=stripe`,
      cancel_url: cancelUrl || callbackUrl,
      metadata: { ...metadata, original_reference: reference },
      client_reference_id: reference,
    });

    return {
      flow: "redirect",
      authorization_url: session.url,
      access_code: null,
      reference: session.id, // Stripe session ID is used for verification
    };
  }

  // reference = Stripe checkout session ID
  async verify(reference) {
    const session = await this.client.checkout.sessions.retrieve(reference);
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }
    return {
      success: true,
      amount: session.amount_total,
      currency: session.currency.toUpperCase(),
      paid_at: new Date(session.created * 1000).toISOString(),
      metadata: session.metadata || {},
    };
  }
}
