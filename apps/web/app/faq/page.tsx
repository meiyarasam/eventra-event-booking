import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function FAQPage() {
  const faqs = [
    {
      q: 'How does the 10-minute ticket reservation work?',
      a: 'When you select tickets and proceed to checkout, EVENTRA places an atomic temporary hold on those seats in the database for 10 minutes. If checkout is completed within this window, the hold converts to a confirmed booking. If the timer expires, the seats are returned automatically to the available pool.',
    },
    {
      q: 'Is real payment required?',
      a: 'No. EVENTRA features a simulated sandbox payment engine supporting test credit/debit cards and test UPI handles. No real banking credentials or payment cards are required or stored.',
    },
    {
      q: 'How do digital QR tickets work at the venue?',
      a: 'Each seat generates a unique cryptographic QR token. Organizers scan this code using our live camera check-in tool. Once scanned, the ticket status changes to CHECKED_IN. Any duplicate attempt to scan the same QR code is immediately flagged and rejected.',
    },
    {
      q: 'Can I cancel my booking for a refund?',
      a: 'Yes, provided the event policy permits it and the cancellation request is made at least 48 hours before the event start time. Cancelled tickets are voided and capacity is released back to the event pool.',
    },
    {
      q: 'How can I become an Event Organizer?',
      a: 'Registered attendees can apply from their Profile Settings by submitting an Organizer Access Request. Platform administrators review and approve requests through the administrative control queue.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-950">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-stone-500">
          Everything you need to know about booking, reservations, and ticketing.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <Card key={i} className="border-stone-200">
            <CardContent className="p-6 space-y-2">
              <h3 className="font-serif font-bold text-base text-stone-900">{f.q}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{f.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
