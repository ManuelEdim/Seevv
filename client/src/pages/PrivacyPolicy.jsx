import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
    <div className="space-y-3 text-sm text-gray-600 leading-relaxed">{children}</div>
  </section>
);

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-[#f8f9fc]">
    {/* Nav */}
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/altnewlogo.png" alt="Seevv" className="h-8" />
        </Link>
        <Link to="/" className="text-xs text-gray-400 hover:text-brand-600 transition-colors">
          ← Back to home
        </Link>
      </div>
    </header>

    {/* Content */}
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      {/* Hero */}
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">Legal</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last updated: April 26, 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10">
        <Section title="1. Introduction">
          <p>
            Welcome to Seevv ("we," "our," or "us"). We operate the Seevv platform (the "Service") — an
            AI-powered career intelligence tool that helps job seekers decode job descriptions, tailor CVs,
            and prepare for interviews.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our Service. Please read it carefully. By using Seevv, you agree to the practices
            described in this policy.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p><span className="font-semibold text-gray-800">Account information:</span> When you register, we collect your name, email address, and password (stored as a secure hash).</p>
          <p><span className="font-semibold text-gray-800">Profile data:</span> Career information you voluntarily provide — job title, industry, country, and voice/writing samples used to personalise AI outputs.</p>
          <p><span className="font-semibold text-gray-800">CV and document data:</span> CV files you upload, job descriptions you paste or import, cover letters, and AI-generated content created on the platform. This data is stored to power the Service.</p>
          <p><span className="font-semibold text-gray-800">Usage data:</span> Pages visited, features used, actions taken, timestamps, and device/browser information. This is collected automatically via server logs and analytics tools.</p>
          <p><span className="font-semibold text-gray-800">Payment data:</span> When you subscribe to a paid plan, payment is processed by Paystack. We receive only a transaction reference and plan identifier — we never store your card details.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide, operate, and improve the Service</li>
            <li>To personalise AI outputs (CV tailoring, cover letters, interview questions) based on your profile</li>
            <li>To authenticate your account and maintain session security</li>
            <li>To process payments and manage your subscription</li>
            <li>To send transactional emails (account confirmation, password reset, billing receipts)</li>
            <li>To detect and prevent fraud, abuse, and security incidents</li>
            <li>To comply with applicable laws and legal obligations</li>
          </ul>
          <p>
            We do not sell your personal data to third parties. We do not use your CV or job-search data
            to train AI models or share it with other users.
          </p>
        </Section>

        <Section title="4. AI Processing">
          <p>
            Seevv uses large language models (LLMs) provided by third-party AI providers to power features
            such as CV tailoring, job description decoding, and interview preparation. When you use these
            features, relevant portions of your data (e.g., CV text, job description) are sent to these
            providers for processing.
          </p>
          <p>
            We rely on providers whose data processing agreements prohibit the use of API inputs to train
            their models. Your data is processed transiently and is not retained by the AI provider beyond
            the scope of the request.
          </p>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>
            Your data is stored in Supabase (PostgreSQL), hosted on secure cloud infrastructure. We use
            row-level security policies to ensure each user can only access their own data.
          </p>
          <p>
            We implement industry-standard security measures including TLS encryption in transit, encrypted
            storage at rest, and authentication tokens with short expiry windows. However, no system is
            perfectly secure — if you believe your account has been compromised, contact us immediately.
          </p>
        </Section>

        <Section title="6. Cookies and Tracking">
          <p>
            We use strictly necessary cookies to maintain your authenticated session. We may use analytics
            tools (such as privacy-respecting aggregators) to understand how users interact with the platform.
          </p>
          <p>
            We do not use third-party advertising cookies or sell browsing data to advertisers.
          </p>
        </Section>

        <Section title="7. Third-Party Services">
          <p>We integrate with the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-semibold text-gray-800">Supabase</span> — authentication and database storage</li>
            <li><span className="font-semibold text-gray-800">Paystack</span> — payment processing</li>
            <li><span className="font-semibold text-gray-800">AI providers</span> — language model inference for AI features</li>
            <li><span className="font-semibold text-gray-800">Remotive API</span> — public job listings in the Job Board feature</li>
          </ul>
          <p>Each third party operates under its own privacy policy and data processing terms.</p>
        </Section>

        <Section title="8. Data Retention">
          <p>
            We retain your data for as long as your account is active. If you delete your account, we will
            delete your personal data within 30 days, except where we are required to retain it for legal
            or compliance reasons.
          </p>
        </Section>

        <Section title="9. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access a copy of the personal data we hold about you</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Object to or restrict certain types of processing</li>
            <li>Export your data in a portable format</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@seevv.com" className="text-brand-600 hover:underline">
              privacy@seevv.com
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="10. Children's Privacy">
          <p>
            Seevv is not directed to individuals under the age of 16. We do not knowingly collect personal
            data from children. If you believe we have inadvertently collected such data, please contact us
            and we will delete it promptly.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by email or by displaying a prominent notice in the platform at least 14 days before the
            changes take effect. Continued use of the Service after the effective date constitutes acceptance.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>
            If you have questions or concerns about this policy, please contact:
          </p>
          <div className="mt-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 space-y-1">
            <p className="font-semibold text-gray-900">Seevv</p>
            <p>Email: <a href="mailto:privacy@seevv.com" className="text-brand-600 hover:underline">privacy@seevv.com</a></p>
          </div>
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">← Back to home</Link>
        <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms of Use →</Link>
      </div>
    </main>
  </div>
);

export default PrivacyPolicy;
