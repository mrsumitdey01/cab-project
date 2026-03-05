import React from 'react';

export function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-slate-600 mt-2">How Safar Express collects and uses your data.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto py-12 px-4 text-slate-600 leading-relaxed space-y-6">
        <p className="text-sm text-slate-400">Last Updated: March 2026</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Introduction</h2>
        <p>Provide a short overview of Safar Express, the purpose of this policy, and user consent.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Data We Collect</h2>
        <p>Describe the data collected including account details, GPS location, ride history, payment details, and device information.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">How We Use Your Data</h2>
        <p>Explain how data is used to provide services, improve safety, and personalize customer experiences.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Data Sharing with Drivers / Partners</h2>
        <p>Clarify what information is shared with drivers, hotel partners, and corporate accounts for fulfillment.</p>

        <h2 className="text-xl text-slate-900 font-bold mt-8">Compliance & Data Protection</h2>
        <p>State compliance with Indian data protection regulations, including the DPDP Act, and user rights.</p>
      </div>
    </div>
  );
}
