import React from 'react';

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 via-slate-200 to-transparent" />
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

export function TermsOfServicePage() {
  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-12 pt-24" id="top">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-4">LEGAL</div>
          <h1 className="text-4xl font-black text-slate-900">Terms of Service</h1>
          <p className="text-slate-500 mt-2 text-lg">Rules and guidelines for using Safar Express.</p>
          <div className="mt-4 inline-flex items-center rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            Effective Date: 1 March 2026 | <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">Last Updated: 7 March 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-6 space-y-2">

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <strong>Please read these Terms carefully.</strong> By booking a cab or using the Safar Express platform, you agree to be legally bound by these Terms of Service. These Terms constitute a legally binding agreement under the <strong>Indian Contract Act, 1872</strong>.
        </div>

        <Section title="1. About Safar Express">
          <p>
            Safar Express is an intercity cab booking platform that connects passengers with transport partners
            ("<strong>Drivers</strong>") across India. We act as a facilitator between passengers and transport providers; we are not
            a transport company ourselves. Actual transportation services are provided by independent drivers and fleet operators.
          </p>
          <p>
            By using our platform, you confirm that you are at least <strong>18 years of age</strong>, legally competent to enter into a
            contract under the Indian Contract Act, 1872, and agree to comply with these Terms.
          </p>
        </Section>

        <Section title="2. User Accounts">
          <p>To book rides on Safar Express, you may create an account. By doing so, you agree to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Provide accurate, current, and complete registration information</li>
            <li>Maintain the confidentiality of your login credentials</li>
            <li>Notify us immediately of any unauthorised access to your account</li>
            <li>Accept responsibility for all activity that occurs under your account</li>
          </ul>
          <p>
            Guest bookings (without an account) are permitted, but your WhatsApp number and name are required for
            communication and trip fulfilment. You remain bound by these Terms in all cases.
          </p>
          <p>
            We reserve the right to suspend or terminate your account if you violate these Terms, provide false information,
            or engage in fraudulent activity.
          </p>
        </Section>

        <Section title="3. Booking Confirmations &amp; Cancellations">
          <p>
            A booking is considered <strong>confirmed</strong> only when you receive an explicit confirmation from Safar Express
            via WhatsApp or email. Until then, it is a pending enquiry.
          </p>
          <p><strong>Cancellation Policy:</strong></p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Cancellations made <strong>more than 24 hours</strong> before the scheduled pickup: No cancellation fee</li>
            <li>Cancellations made between <strong>6–24 hours</strong> before pickup: 25% of the confirmed fare may be charged</li>
            <li>Cancellations made <strong>less than 6 hours</strong> before pickup: Up to 50% of the confirmed fare may be charged</li>
            <li><strong>No-shows</strong> (failure to be present at the pickup point): Full fare may be charged</li>
          </ul>
          <p>
            Cancellation charges, if any, will be communicated at the time of cancellation. We reserve the right to cancel a booking
            due to unavailability of transport, force majeure events, or other exceptional circumstances. In such cases, no
            cancellation charge will apply to the passenger.
          </p>
        </Section>

        <Section title="4. Fares, Payments &amp; Refunds">
          <p>
            Fares displayed on the platform are estimates based on route, cab type, and current conditions. The final confirmed fare
            will be communicated by our team before the trip is confirmed.
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Payment Methods:</strong> Bank transfer, UPI, cash-to-driver, or other methods as notified at time of booking</li>
            <li><strong>Fare Changes:</strong> Fares may be revised for changes in departure date, route, cab type, or surcharges (e.g., toll, state entry tax)</li>
            <li><strong>Refunds:</strong> Eligible refunds will be processed within <strong>7–10 business days</strong> to the original payment method, or as mutually agreed</li>
          </ul>
          <p>
            Safar Express reserves the right to adjust fares in extraordinary circumstances such as fuel price changes, government-mandated
            surcharges, or route unavailability. You will be notified before any such fare change takes effect on your booking.
          </p>
        </Section>

        <Section title="5. Passenger Responsibilities">
          <p>As a passenger, you agree to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Be present at the agreed pickup location at the scheduled time</li>
            <li>Carry valid photo ID (Aadhaar, PAN, Passport, Voter ID, or Driving Licence) as required for intercity travel</li>
            <li>Treat the driver and vehicle with respect and refrain from any illegal, harmful, or abusive behaviour</li>
            <li>Not carry any prohibited or illegal items in the vehicle</li>
            <li>Inform us of any special requirements (wheelchair access, infant seats, excess luggage) at the time of booking</li>
            <li>Comply with all applicable traffic, transport, and public health regulations during the journey</li>
          </ul>
          <p>
            Safar Express reserves the right to refuse service to any passenger who poses a risk to the driver, vehicle, or other passengers.
          </p>
        </Section>

        <Section title="6. Driver &amp; Fleet Partner Responsibilities">
          <p>All drivers and fleet partners engaged through Safar Express are required to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Hold a valid commercial vehicle license and all statutory permits for intercity travel</li>
            <li>Maintain their vehicle in roadworthy condition compliant with the Motor Vehicles Act, 1988</li>
            <li>Comply with all traffic laws, speed limits, and safety norms</li>
            <li>Treat passengers with courtesy and professionalism</li>
            <li>Not deviate from the agreed route without the passenger's consent</li>
          </ul>
          <p>
            Safar Express is not an employer of drivers. Drivers operate as independent contractors. Safar Express does not assume
            liability for the acts or omissions of independent drivers beyond reasonable facilitation.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            To the maximum extent permitted under applicable Indian law:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Safar Express acts solely as a platform facilitator and is not liable for delays caused by traffic, weather, or acts of God</li>
            <li>We are not liable for any indirect, incidental, or consequential loss or damage arising from use of our service</li>
            <li>Our total aggregate liability to you for any direct loss arising out of or in connection with these Terms shall not exceed the fare paid for the specific booking giving rise to the claim</li>
          </ul>
          <p>
            Nothing in these Terms excludes liability for death, personal injury, fraud, or any other liability that cannot be excluded
            under the <strong>Consumer Protection Act, 2019</strong>.
          </p>
          <p>
            Passengers are advised to carry personal travel insurance for intercity journeys. Safar Express does not provide passenger
            travel insurance.
          </p>
        </Section>

        <Section title="8. Prohibited Conduct">
          <p>You must not use Safar Express for any of the following:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Any unlawful, fraudulent, or deceptive purpose</li>
            <li>Impersonating another person or misrepresenting your identity</li>
            <li>Making false, speculative, or repeated bookings with no intention to travel</li>
            <li>Abusing, harassing, or threatening our staff, drivers, or other users</li>
            <li>Attempting to compromise the security or integrity of our platform</li>
          </ul>
          <p>Violation of these conditions may result in account suspension and/or legal action under applicable Indian laws.</p>
        </Section>

        <Section title="9. Intellectual Property">
          <p>
            All content on the Safar Express platform — including design, text, graphics, logos, and software — is the exclusive
            property of Safar Express and protected by applicable intellectual property laws. You may not reproduce, distribute,
            or create derivative works without our express written permission.
          </p>
        </Section>

        <Section title="10. Amendments to Terms">
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on this page with a revised "Last Updated"
            date. If changes are material, we will notify registered users via email. Continued use of our platform after the
            effective date of any amendment constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="11. Governing Law &amp; Dispute Resolution">
          <p>
            These Terms are governed by the laws of the Republic of India, including but not limited to the:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Indian Contract Act, 1872</li>
            <li>Consumer Protection Act, 2019</li>
            <li>Motor Vehicles Act, 1988</li>
            <li>Information Technology Act, 2000</li>
          </ul>
          <p>
            In the event of any dispute arising out of or relating to these Terms, the parties shall first attempt resolution through
            good-faith negotiation. If unresolved within 30 days, disputes shall be subject to the exclusive jurisdiction of
            competent courts located in <strong>Delhi, India</strong>.
          </p>
          <p>
            Consumers retain all rights available to them under the Consumer Protection Act, 2019, including the right to approach
            Consumer Dispute Redressal Commissions.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>If you have any questions about these Terms of Service, please contact our team:</p>
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-sm mt-3">
            <p><strong>Safar Express — Customer Support</strong></p>
            <p><strong>Email:</strong> support@safarexpress.in</p>
            <p><strong>WhatsApp / Phone:</strong> Available on the platform after booking</p>
            <p className="mt-2 text-slate-500">For grievances related to consumer services, you may also file a complaint with the National Consumer Helpline (NCH) at <a href="https://consumerhelpline.gov.in" className="text-blue-600 hover:underline">consumerhelpline.gov.in</a>.</p>
          </div>
        </Section>

        <div className="sticky bottom-6 flex justify-end pointer-events-none">
          <a href="#top" className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            Back to Top
          </a>
        </div>

      </div>
    </div>
  );
}
