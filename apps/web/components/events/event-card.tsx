'use client';

import React from 'react';
import Link from 'next/link';
import { EventDTO } from '@eventra/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MapPin, Globe, Bookmark, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EventCardProps {
  event: EventDTO;
  isSaved?: boolean;
}

export function EventCard({ event, isSaved = false }: EventCardProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Calculate lowest ticket price
  const ticketPrices = event.ticketTypes?.map((t) => Number(t.price)) || [];
  const minPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : 0;
  const isFree = minPrice === 0;

  // Calculate remaining tickets based on actual backend data
  const totalAvailable =
    event.ticketTypes?.reduce((acc, t) => acc + (t.availableQuantity ?? 0), 0) ?? 0;
  const isSoldOut = totalAvailable <= 0;

  // Toggle Save Mutation
  const saveMutation = useMutation({
    mutationFn: () => api.post(`/events/${event.id}/save`),
    onSuccess: (data: any) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ['saved-events'] });
      queryClient.invalidateQueries({ queryKey: ['event', event.slug] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update bookmarks');
    },
  });

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to save events to your bookmarks.');
      return;
    }
    saveMutation.mutate();
  };

  const eventDate = new Date(event.startDate);
  const monthStr = formatDate(event.startDate, { month: 'short' });
  const dayNum = isNaN(eventDate.getTime()) ? '' : eventDate.getDate();

  return (
    <article className="group relative flex flex-col bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden hover:border-brand-500/60 hover:shadow-[0_20px_35px_-10px_rgba(249,115,22,0.18)] hover:-translate-y-1 transition-all duration-300">
      {/* Top: Cover image, date badge, favorite button */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/30" />

        {/* Date Badge: Top Left */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-md border border-slate-700/60 flex flex-col items-center leading-none text-center min-w-[42px] pointer-events-none">
          <span className="text-[10px] font-extrabold uppercase text-brand-400 tracking-wider">
            {monthStr}
          </span>
          <span className="text-base font-black text-white mt-0.5">
            {dayNum}
          </span>
        </div>

        {/* Favorite Button: Top Right (Separate interactive button, not nested) */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          aria-label={isSaved ? 'Remove from bookmarks' : 'Save to bookmarks'}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-brand-400 border border-slate-700/60 backdrop-blur-md shadow-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500 z-10"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand-500 text-brand-500' : ''}`} />
        </button>

        {/* Verified Sold Out Indicator (Only when verified from backend inventory) */}
        {isSoldOut && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-sm">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Middle: Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category & Time */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {event.category && (
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-800/90 text-brand-300 border border-slate-700/60">
              {event.category.name}
            </span>
          )}
          <span className="text-xs text-slate-400 font-medium">
            {formatDate(event.startDate, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>

        {/* Title (Primary Accessible Click Target for the whole card) */}
        <h3 className="font-serif text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug mb-2">
          <Link
            href={`/events/${event.slug || event.id}`}
            className="focus:outline-none focus:underline after:absolute after:inset-0 after:z-0"
          >
            {event.title}
          </Link>
        </h3>

        {/* Location / Venue */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 line-clamp-1 relative z-10 pointer-events-none">
          {event.isOnline ? (
            <>
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-indigo-400 font-medium">Virtual Interactive Broadcast</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                {event.venueName ? `${event.venueName}, ` : ''}
                {event.city || 'Location TBA'}
              </span>
            </>
          )}
        </div>

        {/* Bottom: Price & Call to Action */}
        <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between relative z-10 pointer-events-none">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Admission Pass
            </span>
            <span
              className={`text-sm sm:text-base font-extrabold ${
                isFree ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {isFree ? 'Free Admission' : `From ${formatCurrency(minPrice)}`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-brand-400 group-hover:text-brand-300 group-hover:translate-x-1 transition-all">
            <span>View Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default EventCard;
