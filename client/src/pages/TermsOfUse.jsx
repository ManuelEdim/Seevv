import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
    <div className="space-y-3 text-sm text-gray-600 leading-relaxed">{children}</div>
  </section>
);

const TermsOfUse = () => (
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
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Terms of Use</h1>
        <p className="text-sm text-gray-400">Last updated: April 26, 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-10">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Seevv ("Service"), you agree to be bound by these Terms of Use ("Terms")
            and our <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
            If you do not agree to these Terms, do not use the Service.
          </p>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes are
            published constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Seevv is an AI-powered career intelligence platform that helps job seekers decode job
            descriptions, tailor CVs, generate cover letters, prepare for interviews, and track job
            applications. Features vary by plan tier.
          </p>
          <p>
            The Service is provided "as is." AI-generated outputs are suggestions only — you are
            responsible for reviewing, editing, and verifying any content before submitting it to
            employers.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be at least 16 years old to create an account.</li>
            <li>You must provide accurate and complete registration information and keep it up to date.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must notify us immediately at <a href="mailto:support@seevv.com" className="text-brand-600 hover:underline">support@seevv.com</a> if you suspect unauthorised access to your account.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
            <li>Attempt to gain unauthorised access to any part of the platform or its infrastructure</li>
            <li>Scrape, crawl, or harvest data from the Service using automated tools</li>
            <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
            <li>Use the Service to generate content intended to deceive, defraud, or impersonate others</li>
            <li>Share your account credentials or resell access to the Service</li>
            <li>Submit content that is defamatory, obscene, or that infringes third-party intellectual property rights</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
          </ul>
        </Section>

        <Section title="5. Plans, Billing, and Cancellation">
          <p>
            Seevv offers a free tier and paid subscription plans (Starter, Pro, Pro+). Paid plans are billed
            in advance on a monthly basis. Prices are displayed on the{" "}
            <Link to="/pricing" className="text-brand-600 hover:underline">Pricing page</Link>.
          </p>
          <p>
            Payments are processed securely by Paystack. By subscribing, you authorise Seevv to charge your
            payment method for the applicable plan fee.
          </p>
          <p>
            <span className="font-semibold text-gray-800">Refunds:</span> We do not offer refunds for
            partially used billing periods. If you cancel, your plan remains active until the end of the
            current billing cycle.
          </p>
          <p>
            We reserve the right to change pricing with 30 days' notice. You may cancel your subscription
            at any time from your account settings.
          </p>
        </Section>

        <Section title="6. Your Content">
          <p>
            You retain ownership of all content you upload to or create on the Service, including your CV,
            job descriptions, and cover letters ("Your Content").
          </p>
          <p>
            By using the Service, you grant Seevv a limited, non-exclusive licence to store and process
            Your Content solely for the purpose of providing the Service to you. We do not claim any
            other rights to Your Content.
          </p>
          <p>
            You represent and warrant that Your Content does not infringe any third-party rights and that
            you have all necessary rights to submit it.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            The Seevv platform, including its design, software, brand, and AI-generated templates, is
            owned by Seevv and protected by intellectual property law. Nothing in these Terms transfers
            any ownership of our intellectual property to you.
          </p>
          <p>
            You may use outputs generated by the Service (tailored CVs, cover letters, etc.) for your
            own personal and professional use. You may not resell or sublicense AI-generated outputs as
            a standalone product.
          </p>
        </Section>

        <Section title="8. AI-Generated Content Disclaimer">
          <p>
            AI outputs provided by Seevv are generated by language models and may contain inaccuracies,
            biases, or outdated information. You are solely responsible for reviewing all AI-generated
            content before use.
          </p>
          <p>
            Seevv does not guarantee that AI-generated content will result in employment outcomes. Job
            search results depend on many factors beyond the platform's control.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Seevv shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages — including loss of data, loss of
            revenue, or loss of employment opportunity — arising from your use of the Service.
          </p>
          <p>
            In no event shall our total liability to you for all claims related to the Service exceed
            the amount you paid to Seevv in the 12 months preceding the claim.
          </p>
        </Section>

        <Section title="10. Indemnification">
          <p>
            You agree to indemnify and hold harmless Seevv, its officers, and its team from any claims,
            damages, or expenses (including reasonable legal fees) arising from your use of the Service
            or your violation of these Terms.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            You may delete your account at any time from your account settings. Upon deletion, we will
            remove your data within 30 days.
          </p>
          <p>
            We reserve the right to suspend or terminate your account at any time, with or without notice,
            if we reasonably believe you have violated these Terms or if continued access poses a risk
            to the Service or other users.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to
            conflict of law principles. Any dispute arising under these Terms shall be subject to the
            exclusive jurisdiction of the courts of Nigeria.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>
            Questions about these Terms? Contact us at:
          </p>
          <div className="mt-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 space-y-1">
            <p className="font-semibold text-gray-900">Seevv</p>
            <p>Email: <a href="mailto:legal@seevv.com" className="text-brand-600 hover:underline">legal@seevv.com</a></p>
          </div>
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">← Back to home</Link>
        <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy →</Link>
      </div>
    </main>
  </div>
);

export default TermsOfUse;
