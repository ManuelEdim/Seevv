import express from "express";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  try {
    await resend.emails.send({
      from: "Seevv Contact <onboarding@resend.dev>",
      to: "helloemediahome@gmail.com",
      reply_to: email,
      subject: subject ? `[Seevv] ${subject}` : `[Seevv] New message from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#534ab7;">New contact message</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Subject</td><td style="padding:8px 0;">${subject || "—"}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="color:#374151;line-height:1.6;white-space:pre-wrap;">${message}</p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Contact email error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

export default router;
