'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookingDTO, TicketDTO } from '@eventra/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Printer,
  XCircle,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  Share2,
  Users,
  Armchair,
  Ticket,
  Layers,
} from 'lucide-react';

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  const isJustConfirmed = searchParams.get('success') === 'true';

  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [ticketViewMode, setTicketViewMode] = useState<'GROUPED' | 'INDIVIDUAL'>('GROUPED');
  const [selectedSeatIndexMap, setSelectedSeatIndexMap] = useState<Record<string, number>>({});

  // Fetch Booking details
  const { data: bookingData, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.get<{ data: BookingDTO }>(`/bookings/${bookingId}`),
  });

  const booking = bookingData?.data;



  // Group tickets by ticketTypeId or ticketTypeName into consolidated passes
  const groupedTickets = useMemo(() => {
    if (!booking?.tickets) return [];
    const groups: {
      [key: string]: {
        ticketTypeId: string;
        ticketTypeName: string;
        price: number;
        status: string;
        attendeeName: string;
        tickets: TicketDTO[];
      };
    } = {};

    booking.tickets.forEach((t) => {
      const key = t.ticketTypeId || t.ticketTypeName;
      if (!groups[key]) {
        groups[key] = {
          ticketTypeId: t.ticketTypeId,
          ticketTypeName: t.ticketTypeName,
          price: t.price,
          status: t.status,
          attendeeName: t.attendeeName,
          tickets: [],
        };
      }
      groups[key].tickets.push(t);
    });

    return Object.values(groups);
  }, [booking?.tickets]);

  // Cancel Booking Mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/bookings/${bookingId}/cancel`, { reason }),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Booking cancelled successfully.');
      setCancelModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not cancel booking.');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-12 w-1/2 bg-stone-200 rounded-2xl" />
        <div className="h-64 bg-stone-200 rounded-3xl" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 inline-block">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Booking Not Found</h2>
        <p className="text-sm text-stone-500">
          This booking could not be retrieved or belongs to another user.
        </p>
        <Button onClick={() => router.push('/bookings')}>View My Bookings</Button>
      </div>
    );
  }

  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Success Notification Bar for newly confirmed bookings */}
      {isJustConfirmed && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-emerald-950 text-base">Booking Confirmed & QR Passes Issued!</h3>
              <Badge variant="success" className="text-xs font-extrabold uppercase tracking-wider bg-emerald-600 text-white">
                Booked
              </Badge>
            </div>
            <p className="text-sm text-emerald-800 mt-1">
              Your tickets are confirmed with status <strong>Booked</strong>. Present your digital QR code at the entrance or print your pass below.
            </p>
          </div>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-3 mb-2.5 no-print">
            <button
              onClick={() => {
                if (booking?.event?.slug || booking?.eventId) {
                  router.push(`/events/${booking.event?.slug || booking.eventId}`);
                } else {
                  router.push('/bookings');
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-navy-950 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Event</span>
            </button>
            <span className="text-stone-300">•</span>
            <button
              onClick={() => router.push('/bookings')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-navy-950 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all"
            >
              <span>Booking History</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy-950">
              Booking Ref: {booking.bookingReference}
            </h1>
            <Badge
              variant={isCancelled ? 'danger' : 'success'}
              className="text-xs uppercase tracking-wider font-bold"
            >
              {booking.status === 'CONFIRMED' ? 'Booked' : booking.status}
            </Badge>
          </div>
          <span className="text-xs text-stone-500 mt-1 block">
            Placed on {formatDate(booking.createdAt, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            <span>Print Pass</span>
          </Button>

          {!isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Booking</span>
            </Button>
          )}
        </div>
      </div>

      {/* Event Details Card */}
      {booking.event && (
        <Card className="border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-4">
            <div className="md:col-span-1 h-44 md:h-auto overflow-hidden bg-stone-100 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={booking.event.bannerUrl}
                alt={booking.event.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-3 p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {booking.event.category?.name || 'Event'}
              </span>
              <h2 className="font-serif text-xl font-bold text-navy-950">
                {booking.event.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>{formatDate(booking.event.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  <span>
                    {booking.event.venueName ? `${booking.event.venueName}, ` : ''}
                    {booking.event.city || 'Virtual Broadcast'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Digital QR Tickets Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-navy-950 flex items-center gap-2">
              <span>Digital Ticket Passes</span>
              <Badge variant="outline" className="text-xs bg-stone-100 text-stone-700">
                {groupedTickets.length} {groupedTickets.length === 1 ? 'Pass' : 'Passes'} • {booking.tickets?.length || 0} Total Seats
              </Badge>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Consolidated pass per tier with allocated seats and individual venue entrance QR codes
            </p>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTicketViewMode('GROUPED')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                ticketViewMode === 'GROUPED'
                  ? 'bg-white text-navy-950 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-navy-950'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              <span>Consolidated Passes</span>
            </button>
            <button
              type="button"
              onClick={() => setTicketViewMode('INDIVIDUAL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                ticketViewMode === 'INDIVIDUAL'
                  ? 'bg-white text-navy-950 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-navy-950'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-brand-600" />
              <span>Individual Passes ({booking.tickets?.length || 0})</span>
            </button>
          </div>
        </div>

        {ticketViewMode === 'GROUPED' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {groupedTickets.map((group) => {
              const groupKey = group.ticketTypeId || group.ticketTypeName;
              const activeIndex = selectedSeatIndexMap[groupKey] || 0;
              const activeTicket = group.tickets[activeIndex] || group.tickets[0];
              const totalTierPrice = group.price * group.tickets.length;

              return (
                <div
                  key={groupKey}
                  className={`p-6 rounded-3xl border bg-white shadow-sm flex flex-col justify-between relative overflow-hidden transition-all ${
                    group.status === 'VALID'
                      ? 'border-stone-300'
                      : group.status === 'CHECKED_IN'
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-200 bg-rose-50/20 opacity-80'
                  }`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                          {group.ticketTypeName}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="bg-brand-50 text-brand-700 border-brand-200 gap-1 text-[11px] font-bold"
                          >
                            <Users className="w-3 h-3" />
                            {group.tickets.length} {group.tickets.length === 1 ? 'SEAT' : 'SEATS'}
                          </Badge>
                          <span className="font-mono text-xs text-stone-500">
                            {activeTicket.ticketNumber}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          group.status === 'VALID' || booking.status === 'CONFIRMED'
                            ? 'success'
                            : group.status === 'CHECKED_IN'
                            ? 'brand'
                            : 'danger'
                        }
                        className="text-[10px] font-bold uppercase"
                      >
                        {group.status === 'VALID' ? 'Booked' : group.status}
                      </Badge>
                    </div>

                    {/* Allocated Seats Chips */}
                    <div className="mt-3 bg-stone-50/80 p-3 rounded-2xl border border-stone-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                          <Armchair className="w-3.5 h-3.5 text-brand-600" />
                          Allocated Seats ({group.tickets.length})
                        </span>
                        {group.tickets.length > 1 && (
                          <span className="text-[10px] text-stone-400 font-medium">
                            Select seat to preview QR
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {group.tickets.map((t, idx) => {
                          const isSelected = idx === activeIndex;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() =>
                                setSelectedSeatIndexMap((prev) => ({
                                  ...prev,
                                  [groupKey]: idx,
                                }))
                              }
                              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-300 font-bold'
                                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                              }`}
                            >
                              <Armchair className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                              <span>{t.seatNumber || `Seat ${idx + 1}`}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-stone-400'}`}>
                                (#{t.ticketNumber.slice(-4)})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* QR Code Centerpiece for Active Seat */}
                  <div className="my-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center">
                    {activeTicket.qrCodeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeTicket.qrCodeUrl}
                        alt={`QR Code for ${activeTicket.ticketNumber}`}
                        className="w-40 h-40 object-contain shadow-sm bg-white p-2 rounded-xl"
                      />
                    ) : (
                      <QrCode className="w-36 h-36 text-stone-300" />
                    )}
                    <span className="font-mono text-[11px] text-stone-600 font-semibold mt-2">
                      Scan at venue entrance • {activeTicket.seatNumber || `Seat ${activeIndex + 1}`}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Admission pass covering seat {activeIndex + 1} of {group.tickets.length}
                    </span>
                    {activeTicket.checkedInAt && (
                      <span className="text-[11px] font-semibold text-emerald-700 mt-1">
                        Checked in: {formatDate(activeTicket.checkedInAt, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Pass Bottom Bar */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase">Attendee</span>
                      <span className="font-semibold text-stone-800">{activeTicket.attendeeName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400 block text-[10px] uppercase">
                        {group.tickets.length > 1 ? `Total (${group.tickets.length} seats)` : 'Price Paid'}
                      </span>
                      <span className="font-bold text-navy-950">{formatCurrency(totalTierPrice)}</span>
                      {group.tickets.length > 1 && (
                        <span className="block text-[10px] text-stone-400">
                          {formatCurrency(group.price)} × {group.tickets.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Individual Passes View */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {booking.tickets?.map((ticket, idx) => (
              <div
                key={ticket.id}
                className={`p-6 rounded-3xl border bg-white shadow-sm flex flex-col justify-between relative overflow-hidden transition-all ${
                  ticket.status === 'VALID'
                    ? 'border-stone-300'
                    : ticket.status === 'CHECKED_IN'
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-rose-200 bg-rose-50/20 opacity-80'
                }`}
              >
                {/* Ticket Top bar */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                      {ticket.ticketTypeName}
                    </span>
                    <span className="font-mono text-sm font-bold text-stone-900 block mt-0.5">
                      {ticket.ticketNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 font-semibold mt-0.5">
                      <Armchair className="w-3 h-3" />
                      {ticket.seatNumber || `Seat ${idx + 1}`}
                    </span>
                  </div>
                  <Badge
                    variant={
                      ticket.status === 'VALID' || booking.status === 'CONFIRMED'
                        ? 'success'
                        : ticket.status === 'CHECKED_IN'
                        ? 'brand'
                        : 'danger'
                    }
                    className="text-[10px] font-bold uppercase"
                  >
                    {ticket.status === 'VALID' ? 'Booked' : ticket.status}
                  </Badge>
                </div>

                {/* QR Code Centerpiece */}
                <div className="my-2 p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center">
                  {ticket.qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ticket.qrCodeUrl}
                      alt={`QR Code for ${ticket.ticketNumber}`}
                      className="w-44 h-44 object-contain shadow-sm bg-white p-2 rounded-xl"
                    />
                  ) : (
                    <QrCode className="w-36 h-36 text-stone-300" />
                  )}
                  <span className="font-mono text-[11px] text-stone-500 mt-2">
                    Scan at venue entrance
                  </span>
                  {ticket.checkedInAt && (
                    <span className="text-[11px] font-semibold text-emerald-700 mt-1">
                      Checked in: {formatDate(ticket.checkedInAt, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Ticket Bottom bar */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Attendee</span>
                    <span className="font-semibold text-stone-800">{ticket.attendeeName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 block text-[10px] uppercase">Price Paid</span>
                    <span className="font-bold text-navy-950">{formatCurrency(ticket.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment & Settlement Summary Card */}
      <Card className="border-stone-200">
        <CardHeader className="bg-stone-50/50 pb-4">
          <CardTitle className="text-base">Payment & Settlement Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-500">Payment Status</span>
            <span className="font-semibold text-emerald-700 uppercase">
              {booking.payment?.status || 'SUCCESS'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-500">Method</span>
            <span className="font-semibold text-stone-900">
              {booking.payment?.paymentMethod === 'UPI' ? 'UPI Virtual Handle' : 'Card Simulation (ending in 4242)'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-500">Transaction Reference</span>
            <span className="font-mono text-stone-800">
              {booking.payment?.transactionReference || 'TXN-SETTLED'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 text-sm font-bold text-stone-900">
            <span>Total Settled</span>
            <span>{formatCurrency(booking.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Booking Modal Dialog */}
      <Dialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel This Booking?"
        description="Are you sure you want to cancel your tickets? This action releases your seats back to the public pool."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200">
            <strong className="font-semibold text-amber-100">Cancellation Policy:</strong> Cancellations are only permitted up to 48 hours before the event start time, provided tickets have not already been checked in.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, unable to attend..."
              rows={3}
              className="w-full p-3.5 text-sm rounded-xl border border-slate-700 bg-[#1E293B] text-slate-100 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="danger"
              isLoading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelReason)}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-sm text-stone-400">Loading booking details...</div>}>
      <BookingDetailContent />
    </Suspense>
  );
}
