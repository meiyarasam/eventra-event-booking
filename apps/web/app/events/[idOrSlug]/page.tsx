'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EventDTO, TicketTypeDTO } from '@eventra/shared';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  ShieldCheck,
  User,
  Plus,
  Minus,
  AlertCircle,
  Share2,
  Bookmark,
  CheckCircle,
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.idOrSlug as string;
  const { user, isAuthenticated } = useAuthStore();

  // Selected ticket quantities map: { [ticketTypeId]: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Fetch event details
  const { data: eventData, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', idOrSlug],
    queryFn: () => api.get<{ data: EventDTO & { isSaved?: boolean } }>(`/events/${idOrSlug}`),
  });

  const event = eventData?.data;

  // Toggle Save Event Mutation
  const saveMutation = useMutation({
    mutationFn: () => api.post(`/events/${event?.id}/save`),
    onSuccess: (data: any) => {
      toast.success(data.data.message);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update bookmarks');
    },
  });

  // Create Reservation Mutation (Step 1 -> Step 2)
  const reservationMutation = useMutation({
    mutationFn: (payload: { eventId: string; items: { ticketTypeId: string; quantity: number }[] }) =>
      api.post<{ data: { id: string } }>('/bookings/reservations', payload),
    onSuccess: (res) => {
      toast.success('Tickets held for 10 minutes. Proceeding to checkout...');
      router.push(`/bookings/checkout/${res.data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not hold ticket inventory. Please try again.');
    },
  });

  const handleQuantityChange = (ticketTypeId: string, newQty: number, maxAllowed: number) => {
    if (newQty < 0 || newQty > maxAllowed) return;
    setSelectedQuantities((prev) => ({
      ...prev,
      [ticketTypeId]: newQty,
    }));
  };

  const selectedItems = Object.entries(selectedQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

  const totalSelectedTickets = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const calculateTotalAmount = () => {
    if (!event?.ticketTypes) return 0;
    return selectedItems.reduce((sum, item) => {
      const tt = event.ticketTypes?.find((t) => t.id === item.ticketTypeId);
      return sum + (tt ? Number(tt.price) * item.quantity : 0);
    }, 0);
  };

  const handleContinueToCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in or create an account to book tickets.');
      router.push(`/login?redirect=/events/${idOrSlug}`);
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please select at least 1 ticket to continue.');
      return;
    }

    if (!event) return;

    reservationMutation.mutate({
      eventId: event.id,
      items: selectedItems,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-96 w-full bg-stone-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-3/4 bg-stone-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-1/2 bg-stone-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-40 w-full bg-stone-200 dark:bg-slate-800 rounded-2xl" />
          </div>
          <div className="h-80 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl inline-block mb-4 border border-rose-200/50 dark:border-rose-900/50">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Event Not Found</h2>
        <p className="text-sm text-stone-500 dark:text-slate-400 mb-6">
          The event you are looking for may have been removed, cancelled, or is pending approval.
        </p>
        <Button onClick={() => router.push('/events')}>Browse Other Events</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Event Banner */}
      <div className="relative h-72 sm:h-96 lg:h-[450px] w-full rounded-3xl overflow-hidden bg-stone-900 shadow-md mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.bannerUrl || '/images/hero_event_bg.jpg'}
          alt={event.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/hero_event_bg.jpg';
          }}
          className="w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
          {event.category && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-stone-900 shadow-md">
              {event.category.name}
            </span>
          )}
          {event.isOnline && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-white shadow-md flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Virtual Event
            </span>
          )}
        </div>

        {/* Action buttons on banner */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.info('Sign in to bookmark events.');
                return;
              }
              saveMutation.mutate();
            }}
            className="p-3 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md backdrop-blur-sm transition-colors"
            aria-label="Save Event"
          >
            <Bookmark className={`w-5 h-5 ${event.isSaved ? 'fill-brand-500 text-brand-500' : ''}`} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success('Event link copied to clipboard!');
            }}
            className="p-3 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md backdrop-blur-sm transition-colors"
            aria-label="Share Event"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Banner Title Overlay */}
        <div className="absolute bottom-6 left-6 right-6 text-white max-w-4xl">
          <div className="text-xs uppercase tracking-widest font-semibold text-brand-300 mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.startDate, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Main Grid: Details + Ticket Booking Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Event Details & Bio */}
        <div className="lg:col-span-2 space-y-10">
          {/* Key Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-600 dark:text-slate-400 uppercase tracking-wider block">
                  Date & Time
                </span>
                <span className="text-sm font-semibold text-stone-900 dark:text-white block mt-0.5">
                  {formatDate(event.startDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  {formatDate(event.startDate, { hour: 'numeric', minute: '2-digit' })} -{' '}
                  {formatDate(event.endDate, { hour: 'numeric', minute: '2-digit' })} ({event.timeZone})
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 mt-0.5">
                {event.isOnline ? <Globe className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-600 dark:text-slate-400 uppercase tracking-wider block">
                  Location
                </span>
                {event.isOnline ? (
                  <span className="text-sm font-semibold text-stone-900 dark:text-white block mt-0.5">
                    Online Interactive Broadcast
                  </span>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-stone-900 dark:text-white block mt-0.5">
                      {event.venueName || 'Venue Announced Soon'}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400">
                      {event.venueAddress ? `${event.venueAddress}, ` : ''}
                      {event.city}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* About Event Description */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-navy-950 dark:text-white">About This Event</h2>
            <div className="prose prose-stone dark:prose-invert max-w-none text-stone-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {event.description}
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="p-5 bg-stone-50 dark:bg-[#111827] border border-stone-200 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cancellation & Refund Policy</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
              {event.cancellationPolicy || 'Standard 48-hour cancellation policy applies.'}
            </p>
          </div>

          {/* Organizer Bio */}
          {event.organizer && (
            <div className="p-6 bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-600 dark:text-slate-400">
                Organized by
              </h3>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                  {event.organizer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.organizer.avatarUrl} alt={event.organizer.name} className="w-full h-full object-cover" />
                  ) : (
                    event.organizer.name.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-white">
                    {event.organizer.name}
                  </h4>
                  {event.organizer.organizationName && (
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {event.organizer.organizationName}
                    </p>
                  )}
                  {event.organizer.bio && (
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {event.organizer.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Type Selector & Checkout Sticky Box */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            <Card className="border-stone-200 dark:border-slate-800 shadow-md">
              <CardHeader className="bg-stone-50/50 dark:bg-slate-900/50 pb-4">
                <CardTitle className="text-lg">Select Tickets</CardTitle>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Choose your admission tiers and quantities (up to 10 tickets per tier).
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-5">
                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                  event.ticketTypes.map((ticketType) => {
                    const price = Number(ticketType.price);
                    const qty = selectedQuantities[ticketType.id] || 0;
                    const available = ticketType.availableQuantity ?? 0;
                    const isSoldOut = available <= 0;
                    const maxAllowed = Math.min(10, available);

                    return (
                      <div
                        key={ticketType.id}
                        className={`p-4 rounded-xl border transition-all ${
                          qty > 0
                            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-500/10 shadow-sm'
                            : 'border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <h4 className="font-semibold text-stone-900 dark:text-white text-sm">
                              {ticketType.name}
                            </h4>
                            {ticketType.description && (
                              <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                {ticketType.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-stone-900 dark:text-white text-sm">
                              {price === 0 ? 'Free' : formatCurrency(price)}
                            </span>
                          </div>
                        </div>

                        {/* Availability status */}
                        <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-stone-100 dark:border-slate-800">
                          <div>
                            {isSoldOut ? (
                              <Badge variant="danger" className="text-[10px]">
                                Sold Out
                              </Badge>
                            ) : available <= 5 ? (
                              <span className="text-amber-500 font-semibold text-[11px]">
                                Only {available} left!
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-medium text-[11px]">
                                {available} available <span className="text-stone-400 dark:text-slate-500 font-normal">(Max 10)</span>
                              </span>
                            )}
                          </div>

                          {/* Stepper buttons */}
                          {!isSoldOut && (
                            <div className="flex items-center gap-2 bg-stone-100 dark:bg-slate-800 p-1 rounded-lg">
                              <button
                                type="button"
                                disabled={qty <= 0}
                                onClick={() => handleQuantityChange(ticketType.id, qty - 1, maxAllowed)}
                                className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-stone-900 dark:text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                disabled={qty >= maxAllowed}
                                onClick={() => handleQuantityChange(ticketType.id, qty + 1, maxAllowed)}
                                className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-stone-500 dark:text-slate-400">No ticket types configured yet.</p>
                )}

                {/* Subtotal & Reservation Lock CTA */}
                {totalSelectedTickets > 0 && (
                  <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-600 dark:text-slate-400">Selected Tickets ({totalSelectedTickets})</span>
                      <span className="font-bold text-stone-900 dark:text-white text-lg">
                        {calculateTotalAmount() === 0 ? 'Free' : formatCurrency(calculateTotalAmount())}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-stone-100 dark:border-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span>Locks seat capacity for 10 minutes upon checkout.</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  disabled={totalSelectedTickets === 0}
                  isLoading={reservationMutation.isPending}
                  onClick={handleContinueToCheckout}
                  className="w-full mt-2"
                >
                  {totalSelectedTickets === 0
                    ? 'Select Tickets'
                    : `Reserve & Checkout (${formatCurrency(calculateTotalAmount())})`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
