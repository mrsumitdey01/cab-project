import React from 'react';

export function TermsOfServicePage() {
  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-slate-600 mt-2">Rules and guidelines for using Safar Express.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto py-12 px-4 text-slate-600 leading-relaxed space-y-6">
        <p className="text-sm text-slate-400">Last Updated: March 2026</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">User Accounts</h2>
        <p>Describe account eligibility, user responsibilities, and security requirements.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Ride Bookings & Cancellations</h2>
        <p>Explain booking confirmations, cancellation policies, and dispute handling.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Fare Estimates & Payments</h2>
        <p>Outline fare estimates, payment methods, and refund procedures.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Driver Responsibilities</h2>
        <p>Define standards expected of drivers, vehicle requirements, and service commitments.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Limitation of Liability</h2>
        <p>Include liability limitations, disclaimers, and indemnity clauses.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Governing Jurisdiction</h2>
        <p>Specify governing law and jurisdiction for disputes.</p>
      </div>
    </div>
  );
}
