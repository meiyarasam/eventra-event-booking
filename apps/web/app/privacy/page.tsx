import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy-950">Privacy Policy</h1>
      <p className="text-xs text-stone-500">Last updated: October 2026</p>

      <div className="prose prose-stone text-sm text-stone-700 space-y-4 leading-relaxed">
        <p>
          EVENTRA is committed to safeguarding user data, ticket issuance records, and organizer credentials. This privacy statement explains how user data is collected and managed.
        </p>
        <h3 className="font-serif font-bold text-base text-stone-900 pt-2">1. Information Collection</h3>
        <p>
          We store your name, email address, hashed passwords, and profile details required to fulfill booking orders and generate personal QR tickets.
        </p>
        <h3 className="font-serif font-bold text-base text-stone-900 pt-2">2. Payment Simulation Data</h3>
        <p>
          EVENTRA operates a mock payment simulation environment. Real credit card numbers and CVVs are neither requested nor stored in any persistent storage.
        </p>
        <h3 className="font-serif font-bold text-base text-stone-900 pt-2">3. Cookies & Session Protection</h3>
        <p>
          Authentication tokens are managed strictly using HTTP-only, secure, SameSite cookies to protect against cross-site scripting (XSS) and token theft.
        </p>
      </div>
    </div>
  );
}
