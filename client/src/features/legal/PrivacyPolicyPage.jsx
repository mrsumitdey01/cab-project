import React from 'react';

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-blue-200 via-slate-200 to-transparent" />
      </div>
      <div className="space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-12 pt-24" id="top">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4">LEGAL</div>
          <h1 className="text-4xl font-black text-slate-900">Privacy Policy</h1>
          <p className="text-slate-500 mt-2 text-lg">How Safar Express collects, uses, and protects your personal data.</p>
          <div className="mt-4 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            Effective Date: 1 March 2026 | <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Last Updated: 7 March 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-6 space-y-2">

        <Section title="1. Introduction">
          <p>
            Safar Express ("<strong>we</strong>", "<strong>our</strong>", or "<strong>us</strong>") is committed to protecting your personal
            data and respecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights
            under applicable Indian law, including the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and
            the <strong>Information Technology Act, 2000</strong> and its associated rules.
          </p>
          <p>
            By accessing or using the Safar Express platform — including our website and booking services — you agree to the collection
            and use of your information as described in this policy. If you do not agree, please do not use our services.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Identity &amp; Contact:</strong> Full name, email address, phone/WhatsApp number</li>
            <li><strong>Booking Details:</strong> Pickup location, drop-off location, date, time, ride preferences, and booking history</li>
            <li><strong>Payment Information:</strong> Transaction amounts. We do not store card or UPI credentials; payments are processed by certified third-party gateways</li>
            <li><strong>Device &amp; Usage Data:</strong> IP address, browser type, operating system, pages visited, and session duration (collected via cookies and server logs)</li>
            <li><strong>Location Data:</strong> Approximate pickup/drop-off addresses as entered by you</li>
            <li><strong>Communication Records:</strong> Emails or messages sent to our support team</li>
          </ul>
          <p>We collect only the minimum data necessary to provide our cab booking services.</p>
        </Section>

        <Section title="3. Purpose &amp; Legal Basis for Processing">
          <p>We process your personal data for the following legitimate purposes:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Facilitating cab bookings and managing your account</li>
            <li>Sending booking confirmations, driver details, and service updates via WhatsApp, email, or SMS</li>
            <li>Improving our platform, personalising user experience, and conducting analytics</li>
            <li>Complying with legal obligations under Indian law</li>
            <li>Fraud prevention and resolving disputes</li>
            <li>Marketing communications (only with your explicit consent, and you may opt out at any time)</li>
          </ul>
          <p>Processing is done on the basis of <strong>contractual necessity</strong>, <strong>legitimate interests</strong>, and
            <strong>your consent</strong> where applicable, as provided under the DPDP Act, 2023.</p>
        </Section>

        <Section title="4. Data Sharing with Third Parties">
          <p>We do not sell your personal data. We may share it with the following categories of parties:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Drivers / Transport Partners:</strong> Your name and pickup/drop-off details are shared with the assigned driver or transport partner to fulfil your booking</li>
            <li><strong>Payment Processors:</strong> Regulated payment gateway partners for transaction processing</li>
            <li><strong>IT &amp; Cloud Service Providers:</strong> Hosting, database, and analytics providers bound by data processing agreements</li>
            <li><strong>Legal Authorities:</strong> Government bodies, courts, or law enforcement if required by applicable Indian law or court order</li>
          </ul>
          <p>Any third-party data processors are contractually obligated to maintain data security standards consistent with applicable law.</p>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required
            by applicable law:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Booking records: Retained for <strong>3 years</strong> from the date of the booking, for audit and dispute resolution purposes</li>
            <li>Account data: Retained while your account is active; deleted within <strong>30 days</strong> of a verified account deletion request</li>
            <li>Payment records: Retained for <strong>5 years</strong> as required under Indian financial regulations</li>
          </ul>
        </Section>

        <Section title="6. Your Rights as a Data Principal">
          <p>Under the DPDP Act, 2023, you have the following rights:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete personal data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data, subject to legal retention requirements</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for any processing based solely on consent at any time</li>
            <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint with our Grievance Officer (details below)</li>
            <li><strong>Right to Nominate:</strong> Nominate a person to exercise your rights in the event of incapacity or death</li>
          </ul>
          <p>To exercise any of these rights, please contact us at <strong>privacy@safarexpress.in</strong>.</p>
        </Section>

        <Section title="7. Cookies &amp; Tracking">
          <p>
            We use essential cookies to maintain your session, remember your preferences, and improve security. We may use analytical
            cookies to understand how users interact with our platform. You can manage cookie preferences via your browser settings.
          </p>
          <p>
            We do not use advertising or cross-site tracking cookies.
          </p>
        </Section>

        <Section title="8. Data Security">
          <p>
            We implement reasonable and appropriate technical and organisational security measures to protect your personal data from
            unauthorised access, disclosure, alteration, or destruction, including:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>HTTPS/TLS encryption for all data in transit</li>
            <li>Hashed storage of passwords (bcrypt)</li>
            <li>Access controls limiting data access to authorised personnel only</li>
            <li>Regular security audits and monitoring</li>
          </ul>
          <p>However, no method of transmission over the internet is 100% secure. In the event of a data breach, we will notify
            affected individuals and the Data Protection Board of India as required by law.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Our services are not intended for persons under the age of 18. We do not knowingly collect personal data from minors.
            If you believe we have unintentionally collected data from a minor, please contact us immediately at <strong>privacy@safarexpress.in</strong>
            and we will delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date above and,
            if changes are material, notify registered users by email or via a banner on our website. Continued use of the platform
            after such changes constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Grievance Officer">
          <p>
            In accordance with the Information Technology Act, 2000 and the DPDP Act, 2023, we have appointed a Grievance Officer
            to address any privacy-related concerns:
          </p>
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-sm mt-3">
            <p><strong>Grievance Officer:</strong> Data Protection Team, Safar Express</p>
            <p><strong>Email:</strong> privacy@safarexpress.in</p>
            <p><strong>Response Time:</strong> We will acknowledge your complaint within 48 hours and resolve it within 30 days</p>
            <p className="mt-2 text-slate-500">
              If your complaint is not resolved to your satisfaction, you may escalate to the <strong>Data Protection Board of India</strong> at
              <a href="https://dpboard.gov.in" className="text-blue-600 hover:underline ml-1">dpboard.gov.in</a>.
            </p>
          </div>
        </Section>

        <Section title="12. Governing Law &amp; Jurisdiction">
          <p>
            This Privacy Policy is governed by and construed in accordance with the laws of India, including but not limited to the
            Digital Personal Data Protection Act, 2023, the Information Technology Act, 2000, and the Information Technology
            (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
            Any disputes arising under this policy shall be subject to the exclusive jurisdiction of the courts in <strong>Delhi, India</strong>.
          </p>
        </Section>

        <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-slate-600">
          <p className="font-semibold text-slate-700 mb-1">Contact Us</p>
          <p>For any questions about this Privacy Policy, please reach out to us at <strong>privacy@safarexpress.in</strong> or write to us at our registered office address.</p>
        </div>

        <div className="sticky bottom-6 flex justify-end pointer-events-none">
          <a href="#top" className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur hover:border-blue-300 hover:text-blue-600 transition-colors">
            Back to Top
          </a>
        </div>

      </div>
    </div>
  );
}
