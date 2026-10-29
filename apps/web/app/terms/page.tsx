import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Terms and Conditions</h1>
      <p className="text-xs text-stone-500 dark:text-slate-400">Effective: October 2026</p>

      <div className="prose prose-stone dark:prose-invert text-sm text-stone-700 dark:text-slate-300 space-y-4 leading-relaxed">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">1. Acceptance of Terms</h3>
        <p>
          By creating an account or booking passes on EVENTRA, you agree to comply with our ticketing rules, event moderation standards, and cancellation policies.
        </p>
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">2. Ticket Validity & Check-In</h3>
        <p>
          Tickets issued on EVENTRA are licensed admissions. Each ticket QR pass is single-use and invalidates upon check-in. Any duplication or unauthorized resale is prohibited.
        </p>
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">3. Organizer Conduct</h3>
        <p>
          Organizers must provide accurate event descriptions and adhere to cancellation policies. Misleading submissions are subject to administrative rejection and account suspension.
        </p>
      </div>
    </div>
  );
}
