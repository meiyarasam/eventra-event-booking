'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EventDTO } from '@eventra/shared';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Bookmark,
  Calendar,
  MapPin,
  ArrowRight,
  Trash2,
  Ticket,
} from 'lucide-react';

export default function SavedEventsPage() {
  const { data: savedData, isLoading, refetch } = useQuery({
    queryKey: ['saved-events'],
    queryFn: () => api.get<{ data: EventDTO[] }>('/events/saved'),
  });

  const events = savedData?.data || [];

  const removeBookmarkMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/events/${eventId}/save`),
    onSuccess: (data: any) => {
      toast.success(data.data.message || 'Bookmark removed');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update bookmark');
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy-950">Saved Events</h1>
        <p className="text-sm text-stone-500 mt-1">
          Your bookmarked concerts, tech conferences, and workshops saved for easy booking.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-stone-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-12 h-12 text-stone-400" />}
          title="No Saved Events"
          description="You haven't bookmarked any events yet. Browse our curated listings and click the bookmark icon on events that catch your eye."
          actionText="Discover Events"
          actionHref="/events"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <Card key={ev.id} className="border-stone-200 overflow-hidden shadow-sm hover:border-brand-400 transition-all flex flex-col justify-between">
              <div>
                <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ev.bannerUrl}
                    alt={ev.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <button
                    onClick={() => removeBookmarkMutation.mutate(ev.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-rose-600 hover:bg-white shadow-sm transition-all"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <CardContent className="p-5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                    {ev.city || (ev.isOnline ? 'Online Event' : 'Featured')}
                  </span>
                  <h3 className="font-serif font-bold text-base text-stone-900 line-clamp-2 leading-snug">
                    {ev.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-stone-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatDate(ev.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{ev.venueName ? `${ev.venueName}, ` : ''}{ev.city || 'Online'}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                <Link href={`/events/${ev.slug || ev.id}`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full gap-2 font-semibold shadow-sm">
                    <Ticket className="w-4 h-4" />
                    <span>View & Book Passes</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
