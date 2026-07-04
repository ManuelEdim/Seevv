import { getEmailProvider, isEmailEnabled } from "./emailProvider.js";
import { getApiKey } from "./keyStore.js";
import { supabase } from "./supabase.js";

const BADGE_LABELS = {
  identity:   "Identity",
  employment: "Employment",
  education:  "Education",
  skills:     "Skills",
};

async function getFromAddress() {
  const custom = await getApiKey("notify_from_email", "NOTIFY_FROM_EMAIL");
  return custom || "Seevv <onboarding@resend.dev>";
}

async function getUserProfile(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();
  return data || null;
}

// Branded email shell — navy header, white card, footer
function brandedHtml(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #edf0f4;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:#0d1f3c;padding:22px 32px;">
    <a href="https://seevv.io" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
      <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Seevv</span>
    </a>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 32px 24px;">${content}</td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;border-top:1px solid #edf0f4;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
      © ${new Date().getFullYear()} Seevv &nbsp;·&nbsp;
      <a href="https://seevv.io" style="color:#9ca3af;text-decoration:none;">seevv.io</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Verification approved ────────────────────────────────────
export async function sendVerificationApproved(userId, badgeType) {
  if (!await isEmailEnabled()) return;
  const user = await getUserProfile(userId);
  if (!user?.email) return;

  const label = BADGE_LABELS[badgeType] || badgeType;
  const provider = await getEmailProvider();
  const from = await getFromAddress();

  await provider.send({
    from,
    to: user.email,
    subject: `Your ${label} badge has been approved`,
    html: brandedHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Badge approved</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
        Hi${user.full_name ? ` ${user.full_name.split(" ")[0]}` : ""},<br>your
        <strong style="color:#1d9e75;">${label} verification badge</strong>
        has been approved and is now showing on your profile.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">✓</span>
        <span style="font-size:14px;font-weight:600;color:#166534;">${label} badge active</span>
      </div>
      <a href="https://seevv.io/verification"
        style="display:inline-block;background:#1d9e75;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.01em;">
        View your profile →
      </a>
    `),
  });
}

// ─── Verification rejected ────────────────────────────────────
export async function sendVerificationRejected(userId, badgeType, reason = "") {
  if (!await isEmailEnabled()) return;
  const user = await getUserProfile(userId);
  if (!user?.email) return;

  const label = BADGE_LABELS[badgeType] || badgeType;
  const provider = await getEmailProvider();
  const from = await getFromAddress();

  const reasonBlock = reason
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">${reason}</p>
       </div>`
    : "";

  await provider.send({
    from,
    to: user.email,
    subject: `Update on your ${label} badge request`,
    html: brandedHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Badge request update</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
        Hi${user.full_name ? ` ${user.full_name.split(" ")[0]}` : ""},<br>
        we weren't able to approve your <strong>${label} verification badge</strong> at this time.
      </p>
      ${reasonBlock}
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        You can resubmit your request from the verification page once you've addressed any issues.
      </p>
      <a href="https://seevv.io/verification"
        style="display:inline-block;background:#0d1f3c;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.01em;">
        Go to verification →
      </a>
    `),
  });
}

// ─── Interview reminder ───────────────────────────────────────
export async function sendInterviewReminder(userId, { jobTitle, company, interviewDate }) {
  if (!await isEmailEnabled()) return;
  const user = await getUserProfile(userId);
  if (!user?.email) return;

  const provider = await getEmailProvider();
  const from = await getFromAddress();
  const dateStr = new Date(interviewDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = new Date(interviewDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  await provider.send({
    from,
    to: user.email,
    subject: `Interview reminder: ${jobTitle} at ${company} — tomorrow`,
    html: brandedHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Interview reminder</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
        Hi${user.full_name ? ` ${user.full_name.split(" ")[0]}` : ""},<br>
        you have an interview tomorrow. Here are the details:
      </p>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0c4a6e;">${jobTitle}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#0369a1;">${company}</p>
        <p style="margin:0;font-size:13px;color:#0369a1;">${dateStr} at ${timeStr}</p>
      </div>
      <a href="https://seevv.io/tracker"
        style="display:inline-block;background:#1d9e75;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View application →
      </a>
    `),
  });
}

// ─── Job match alert ──────────────────────────────────────────
export async function sendJobMatchAlert(userId, jobs) {
  if (!await isEmailEnabled()) return;
  if (!jobs?.length) return;
  const user = await getUserProfile(userId);
  if (!user?.email) return;

  const provider = await getEmailProvider();
  const from = await getFromAddress();
  const jobRows = jobs.slice(0, 5).map((j) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top">
        <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">${j.title || j.job_title || ""}</p>
        <p style="margin:0;font-size:12px;color:#6b7280;">${j.company || j.company_name || ""}${j.location ? ` · ${j.location}` : ""}</p>
      </td>
    </tr>`).join("");

  await provider.send({
    from,
    to: user.email,
    subject: `${jobs.length} new job${jobs.length > 1 ? "s" : ""} matching your saved search`,
    html: brandedHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">New job matches</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
        Hi${user.full_name ? ` ${user.full_name.split(" ")[0]}` : ""},<br>
        we found ${jobs.length} new job${jobs.length > 1 ? "s" : ""} matching your saved search.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${jobRows}
      </table>
      <a href="https://seevv.io/jobs"
        style="display:inline-block;background:#1d9e75;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View all matches →
      </a>
    `),
  });
}

// ─── Weekly digest ────────────────────────────────────────────
export async function sendWeeklyDigest(userId, { applications, upcomingInterviews, matchScore }) {
  if (!await isEmailEnabled()) return;
  const user = await getUserProfile(userId);
  if (!user?.email) return;

  const provider = await getEmailProvider();
  const from = await getFromAddress();
  const appCount = applications?.length || 0;
  const interviewCount = upcomingInterviews?.length || 0;
  const avgScore = matchScore || 0;

  await provider.send({
    from,
    to: user.email,
    subject: "Your Seevv weekly summary",
    html: brandedHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Your week in review</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
        Hi${user.full_name ? ` ${user.full_name.split(" ")[0]}` : ""},<br>here's what happened with your job search this week.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${[
          ["Applications in progress", appCount],
          ["Upcoming interviews", interviewCount],
          ["Avg. CV match score", avgScore ? `${avgScore}%` : "—"],
        ].map(([label, value]) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">${label}</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#111827;text-align:right;">${value}</td>
          </tr>`).join("")}
      </table>
      <a href="https://seevv.io/dashboard"
        style="display:inline-block;background:#0d1f3c;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Go to dashboard →
      </a>
    `),
  });
}

// ─── Welcome email (after signup) ─────────────────────────────
export async function sendWelcome(userId) {
  if (!await isEmailEnabled()) return;
  const user = await getUserProfile(userId);
  if (!user?.email) return;

  const provider = await getEmailProvider();
  const from = await getFromAddress();

  await provider.send({
    from,
    to: user.email,
    subject: "Welcome to Seevv",
    html: brandedHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
        Welcome${user.full_name ? ` ${user.full_name.split(" ")[0]}` : ""}
      </h2>
      <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
        Your account is ready. Here's how to get started:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${[
          ["1", "Upload your CV", "Go to My CVs and upload your master CV — Seevv will parse and index it.", "/cv"],
          ["2", "Decode a job", "Paste any job description into the Deep Decoder to see exactly what the employer needs.", "/decoder"],
          ["3", "Tailor and export", "Seevv rewrites your CV bullet by bullet for the role. Review, accept, and download.", "/cv"],
        ].map(([n, title, desc, path]) => `
          <tr>
            <td style="padding:12px 0;vertical-align:top;border-bottom:1px solid #f3f4f6;">
              <div style="display:flex;align-items:flex-start;gap:14px;">
                <div style="width:28px;height:28px;background:#0d1f3c;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
                  <span style="font-size:12px;font-weight:700;color:#ffffff;">${n}</span>
                </div>
                <div>
                  <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#111827;">${title}</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
                </div>
              </div>
            </td>
          </tr>`).join("")}
      </table>
      <a href="https://seevv.io/dashboard"
        style="display:inline-block;background:#1d9e75;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.01em;">
        Go to your dashboard →
      </a>
    `),
  });
}
