'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TicketDTO } from '@eventra/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/ui/brand-logo';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Download,
  AlertCircle,
} from 'lucide-react';

export default function IndividualTicketPassPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const { data: ticketData, isLoading, isError } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => api.get<{ data: TicketDTO }>(`/tickets/${ticketId}`),
  });

  const ticket = ticketData?.data;

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 w-1/3 bg-stone-200 rounded-xl" />
        <div className="h-96 bg-stone-200 rounded-3xl" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 inline-block">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Ticket Not Found</h2>
        <p className="text-sm text-stone-500">
          This digital pass could not be retrieved. Please verify your account or booking list.
        </p>
        <Link href="/tickets">
          <Button variant="primary">Back to My Tickets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Passes</span>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
          <Printer className="w-3.5 h-3.5" />
          <span>Print Pass</span>
        </Button>
      </div>

      {/* Ticket Pass Container */}
      <div className="bg-white rounded-3xl border border-stone-300 shadow-xl overflow-hidden print:shadow-none print:border-stone-800">
        {/* Event Header Banner */}
        <div className="bg-navy-950 text-white p-6 relative">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <BrandLogo size="sm" theme="dark" />
            <Badge
              variant={
                ticket.status === 'VALID'
                  ? 'brand'
                  : ticket.status === 'CHECKED_IN'
                  ? 'success'
                  : 'danger'
              }
              className="text-xs uppercase font-bold"
            >
              {ticket.status === 'VALID' ? 'Admit One' : ticket.status}
            </Badge>
          </div>

          <div className="pt-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 block">
              {ticket.ticketTypeName}
            </span>
            <h1 className="font-serif text-2xl font-bold leading-snug">{ticket.eventName}</h1>
          </div>
        </div>

        {/* Notched Pass Divider */}
        <div className="relative h-6 bg-stone-100 flex items-center justify-between px-4">
          <div className="w-6 h-6 rounded-full bg-[#FAFAFA] -ml-7 shadow-inner" />
          <div className="w-full border-t-2 border-dashed border-stone-300 mx-2" />
          <div className="w-6 h-6 rounded-full bg-[#FAFAFA] -mr-7 shadow-inner" />
        </div>

        {/* QR Code and Gate Admission Details */}
        <div className="p-6 space-y-6 bg-white">
          <div className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-200">
            {ticket.qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ticket.qrCodeUrl}
                alt={`QR Pass for ${ticket.ticketNumber}`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <QrCode className="w-48 h-48 text-stone-300" />
            )}
            <span className="font-mono text-sm font-bold text-stone-900 mt-3 tracking-widest">
              {ticket.ticketNumber}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5">
              Scan with EVENTRA gate scanner at entrance
            </span>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Pass Holder</span>
              <span className="font-semibold text-stone-800 text-sm">{ticket.attendeeName}</span>
              <span className="text-stone-500 text-[11px] block">{ticket.attendeeEmail}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Date & Time</span>
              <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>{formatDate(ticket.eventStartDate)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Venue Location</span>
              <div className="flex items-start gap-1.5 text-stone-800 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                <span>{ticket.venueName ? `${ticket.venueName}, ` : ''}{ticket.city || 'Virtual'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Booking Ref</span>
              <Link
                href={`/bookings/${ticket.bookingId}`}
                className="font-mono text-brand-600 hover:underline font-semibold block"
              >
                View Order
              </Link>
            </div>
          </div>
        </div>

        {/* Security & Verification Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Verified Pass</span>
          </div>
          <span className="font-mono text-[10px]">EVENTRA ID: {ticket.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}
