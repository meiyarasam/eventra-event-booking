'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookingDTO } from '@eventra/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Ticket, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function BookingsListPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  const { data: bookingsData, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get<{ data: BookingDTO[] }>('/bookings/me'),
  });

  const bookings = bookingsData?.data || [];
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-950">My Event Bookings</h1>
          <p className="text-sm text-stone-500 mt-1">
            Review your confirmed tickets, order references, and digital QR passes.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          {(['ALL', 'CONFIRMED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab === 'ALL' ? 'All Bookings' : tab === 'CONFIRMED' ? 'Booked' : 'Cancelled'}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-stone-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-12 h-12 text-stone-400" />}
          title="No Bookings Found"
          description={
            statusFilter === 'ALL'
              ? 'You have not booked any tickets yet. Explore upcoming summits, concerts, and workshops.'
              : `No bookings found in ${statusFilter.toLowerCase()} status.`
          }
          actionText="Explore Events"
          actionHref="/events"
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <Card key={b.id} className="border-stone-200 hover:border-stone-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Thumbnail and Event Details */}
                  <div className="flex items-start gap-4">
                    {b.event?.bannerUrl && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.event.bannerUrl}
                          alt={b.event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-stone-500">
                          {b.bookingReference}
                        </span>
                        <Badge
                          variant={b.status === 'CONFIRMED' ? 'success' : 'danger'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {b.status === 'CONFIRMED' ? 'Booked' : b.status}
                        </Badge>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-1">
                        {b.event?.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {b.event?.startDate ? formatDate(b.event.startDate, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}
                        </span>
                        <span>•</span>
                        <span>{b.tickets?.length || 0} Ticket(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Price & CTA */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                        Total Settled
                      </span>
                      <span className="text-lg font-bold text-navy-950">
                        {formatCurrency(b.totalAmount)}
                      </span>
                    </div>

                    <Link href={`/bookings/${b.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
                        <span>View Pass & QR</span>
                        <ArrowRight className="w-4 h-4 text-stone-500" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
