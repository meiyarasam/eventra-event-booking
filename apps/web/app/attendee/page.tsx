'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { BookingDTO, TicketDTO, EventDTO, NotificationDTO } from '@eventra/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  Calendar,
  Ticket,
  Bookmark,
  Bell,
  ArrowRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';

export default function AttendeeDashboardPage() {
  const { user } = useAuthStore();

  // Bookings query
  const { data: bookingsData } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get<{ data: BookingDTO[] }>('/bookings/me'),
  });
  const bookings = bookingsData?.data || [];

  // Tickets query
  const { data: ticketsData } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get<{ data: TicketDTO[] }>('/tickets/me'),
  });
  const tickets = ticketsData?.data || [];

  // Saved events query
  const { data: savedEventsData } = useQuery({
    queryKey: ['saved-events'],
    queryFn: () => api.get<{ data: EventDTO[] }>('/events/saved'),
  });
  const savedEvents = savedEventsData?.data || [];

  // Notifications query
  const { data: notifData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.get<{ data: NotificationDTO[] }>('/notifications'),
    enabled: !!user,
  });
  const notifications = notifData?.data || [];

  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const validTickets = tickets.filter((t) => t.status === 'VALID');
  const totalSpend = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-navy-900 to-stone-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Attendee Center</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome back, {user?.name || 'Attendee'}
          </h1>
          <p className="text-sm text-stone-300 max-w-xl">
            Track your confirmed passes, upcoming event itineraries, and saved experiences in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/events">
            <Button variant="primary" size="md">
              Discover Events
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" size="md" className="border-stone-700 bg-stone-800/80 text-white hover:bg-stone-700">
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 border-t-4 border-t-brand-500 bg-gradient-to-b from-brand-50/40 dark:from-brand-500/10 to-white dark:to-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-800 dark:text-brand-400 block">
              Active Passes
            </span>
            <span className="text-3xl font-extrabold text-navy-950 dark:text-white mt-1 block">
              {validTickets.length}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">Valid for check-in</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 bg-gradient-to-b from-emerald-50/40 dark:from-emerald-500/10 to-white dark:to-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
              Confirmed Bookings
            </span>
            <span className="text-3xl font-extrabold text-navy-950 dark:text-white mt-1 block">
              {confirmedBookings.length}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">All-time reservations</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 border-t-4 border-t-purple-500 bg-gradient-to-b from-purple-50/40 dark:from-purple-500/10 to-white dark:to-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400 block">
              Saved Events
            </span>
            <span className="text-3xl font-extrabold text-navy-950 dark:text-white mt-1 block">
              {savedEvents.length}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">In your wishlist</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 border-t-4 border-t-amber-500 bg-gradient-to-b from-amber-50/40 dark:from-amber-500/10 to-white dark:to-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
              Total Invested
            </span>
            <span className="text-3xl font-extrabold text-navy-950 dark:text-white mt-1 block">
              {formatCurrency(totalSpend)}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">Simulated settlements</span>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Upcoming Passes & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Passes & Recent Bookings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Digital Passes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Upcoming Passes</span>
              </h2>
              <Link href="/tickets" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700">
                View all passes →
              </Link>
            </div>

            {validTickets.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#111827] border border-dashed border-stone-200 dark:border-slate-800 rounded-2xl">
                <p className="text-sm text-stone-500 dark:text-slate-400 mb-3">No active upcoming tickets found.</p>
                <Link href="/events">
                  <Button variant="outline" size="sm">
                    Browse Upcoming Events
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {validTickets.slice(0, 2).map((t) => (
                  <div key={t.id} className="p-5 bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-stone-500 dark:text-slate-400">{t.ticketNumber}</span>
                      <Badge variant="success" className="text-[10px]">
                        VALID
                      </Badge>
                    </div>
                    <h3 className="font-serif font-bold text-stone-900 dark:text-white text-sm line-clamp-1">{t.eventName}</h3>
                    <div className="text-xs text-stone-500 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                        <span>{formatDate(t.eventStartDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                        <span>{t.city || 'Virtual'}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">{t.ticketTypeName}</span>
                      <Link href="/tickets">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Show QR</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Recent Bookings</span>
              </h2>
              <Link href="/bookings" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700">
                View all bookings →
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#111827] border border-dashed border-stone-200 dark:border-slate-800 rounded-2xl">
                <p className="text-sm text-stone-500 dark:text-slate-400">You haven't placed any bookings yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="p-4 bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-500 dark:text-slate-400">{b.bookingReference}</span>
                        <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'danger'} className="text-[10px]">
                          {b.status}
                        </Badge>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white mt-1 line-clamp-1">
                        {b.event?.title}
                      </h4>
                      <span className="text-xs text-stone-400 dark:text-slate-500">
                        {formatDate(b.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-navy-950 dark:text-white block">
                        {formatCurrency(b.totalAmount)}
                      </span>
                      <Link href={`/bookings/${b.id}`} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Notifications & Saved Events */}
        <div className="space-y-8">
          {/* Notifications feed */}
          <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <CardHeader className="bg-stone-50/50 dark:bg-slate-900/50 pb-3 border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-stone-900 dark:text-white">
                  <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Recent Alerts</span>
                </CardTitle>
                <Link href="/notifications" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold">
                  Inbox
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-slate-400 text-center py-4">No recent notifications</p>
              ) : (
                notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="font-semibold text-stone-900 dark:text-white">{n.title}</div>
                    <div className="text-stone-600 dark:text-slate-300 line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-stone-400 dark:text-slate-500 pt-1">
                      {formatDate(n.createdAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Bookmarked Events */}
          <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <CardHeader className="bg-stone-50/50 dark:bg-slate-900/50 pb-3 border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-stone-900 dark:text-white">
                  <Bookmark className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Saved Events</span>
                </CardTitle>
                <Link href="/events" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold">
                  Explore
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {savedEvents.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-slate-400 text-center py-4">No saved events yet</p>
              ) : (
                savedEvents.slice(0, 3).map((ev) => (
                  <Link key={ev.id} href={`/events/${ev.slug}`} className="block group">
                    <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 group-hover:border-brand-300 dark:group-hover:border-brand-500 bg-white dark:bg-slate-900/40 transition-colors">
                      <h4 className="font-semibold text-xs text-stone-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-1">
                        {ev.title}
                      </h4>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">
                        {formatDate(ev.startDate, { month: 'short', day: 'numeric' })} • {ev.city || 'Virtual'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
