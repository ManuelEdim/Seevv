import { Resend } from "resend";

export default class ResendProvider {
  static id = "resend";
  static label = "Resend";

  constructor(apiKey) {
    this.client = new Resend(apiKey);
  }

  async send({ from, to, subject, html, replyTo }) {
    const { error } = await this.client.emails.send({
      from,
      to,
      reply_to: replyTo,
      subject,
      html,
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
  }
}
