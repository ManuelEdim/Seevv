const BASE = "https://api.sendgrid.com/v3";

export default class SendGridProvider {
  static id = "sendgrid";
  static label = "SendGrid";

  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async send({ from, to, subject, html, replyTo }) {
    const body = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: "text/html", value: html }],
    };
    if (replyTo) body.reply_to = { email: replyTo };

    const res = await fetch(`${BASE}/mail/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SendGrid error ${res.status}: ${text}`);
    }
  }
}
