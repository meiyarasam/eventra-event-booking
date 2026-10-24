'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BookingDTO } from '@eventra/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';

export default function BookingSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking-success', bookingId],
    queryFn: () => api.get<{ data: BookingDTO }>(`/bookings/${bookingId}`),
  });

  const booking = bookingData?.data;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <Badge variant="brand" className="gap-1.5 uppercase font-bold text-xs py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Booking Confirmed</span>
          </Badge>
          <h1 className="font-serif text-3xl font-bold text-navy-950 pt-2">
            You&apos;re Going to the Event!
          </h1>
          <p className="text-sm text-stone-600">
            Simulated payment successful. Your digital passes with secure admission QR codes have been issued.
          </p>
        </div>
      </div>

      <Card className="border-stone-200 shadow-md overflow-hidden">
        <div className="bg-stone-50 p-6 border-b border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Booking Reference</span>
            <span className="font-mono text-base font-bold text-stone-900">
              {booking?.bookingReference || bookingId}
            </span>
          </div>
          <Badge variant="success" className="font-bold uppercase text-xs">
            Payment Confirmed
          </Badge>
        </div>

        <CardContent className="p-6 space-y-6">
          {booking?.event && (
            <div className="space-y-2 pb-4 border-b border-stone-100">
              <h3 className="font-serif text-xl font-bold text-stone-900">{booking.event.title}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>{formatDate(booking.event.startDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  <span>{booking.event.venueName ? `${booking.event.venueName}, ` : ''}{booking.event.city || 'Online'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 text-xs">
            <span className="font-bold text-stone-700 uppercase tracking-wider block">Tickets Issued</span>
            {booking?.tickets && booking.tickets.length > 0 ? (
              <div className="space-y-2">
                {booking.tickets.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block">{t.ticketTypeName}</span>
                      <span className="font-mono text-[11px] text-stone-500">{t.ticketNumber}</span>
                    </div>
                    <Link href={`/tickets`}>
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        <Ticket className="w-3.5 h-3.5 text-brand-600" />
                        <span>View QR Pass</span>
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-500">Tickets have been generated in your account.</p>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link href="/tickets" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full gap-2 font-semibold shadow-md">
                <Ticket className="w-4 h-4" />
                <span>Go to My Tickets & Passes</span>
              </Button>
            </Link>
            <Link href={`/bookings/${bookingId}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                View Receipt & Invoice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
