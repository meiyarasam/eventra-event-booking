'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TicketDTO } from '@eventra/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import {
  Ticket,
  QrCode,
  Calendar,
  MapPin,
  Printer,
  Users,
  Armchair,
  Layers,
} from 'lucide-react';

interface GroupedTicketPass {
  key: string;
  bookingId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  eventName?: string;
  eventStartDate?: string;
  venueName?: string;
  city?: string;
  status: string;
  attendeeName: string;
  price: number;
  tickets: TicketDTO[];
}

export default function MyTicketsPage() {
  const [selectedGroupForQR, setSelectedGroupForQR] = useState<{
    group: GroupedTicketPass;
    selectedSeatIndex: number;
  } | null>(null);
  const [selectedSingleTicketForQR, setSelectedSingleTicketForQR] = useState<TicketDTO | null>(null);
  const [ticketViewMode, setTicketViewMode] = useState<'GROUPED' | 'INDIVIDUAL'>('GROUPED');

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get<{ data: TicketDTO[] }>('/tickets/me'),
  });

  const tickets = ticketsData?.data || [];

  // Group tickets by bookingId + ticketTypeId
  const groupedPasses = useMemo(() => {
    if (!tickets.length) return [];
    const map: Record<string, GroupedTicketPass> = {};

    tickets.forEach((t) => {
      const key = `${t.bookingId}_${t.ticketTypeId || t.ticketTypeName}`;
      if (!map[key]) {
        map[key] = {
          key,
          bookingId: t.bookingId,
          ticketTypeId: t.ticketTypeId,
          ticketTypeName: t.ticketTypeName,
          eventName: t.eventName,
          eventStartDate: t.eventStartDate,
          venueName: t.venueName || undefined,
          city: t.city || undefined,
          status: t.status,
          attendeeName: t.attendeeName,
          price: t.price,
          tickets: [],
        };
      }
      map[key].tickets.push(t);
    });

    return Object.values(map);
  }, [tickets]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">My Digital Tickets & Passes</h1>
            {tickets.length > 0 && (
              <Badge variant="outline" className="text-xs bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700">
                {groupedPasses.length} {groupedPasses.length === 1 ? 'Pass' : 'Passes'} • {tickets.length} Seats
              </Badge>
            )}
          </div>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            Access your consolidated admission passes and scannable gate QR codes.
          </p>
        </div>

        {/* View Mode Switcher */}
        {tickets.length > 0 && (
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-stone-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTicketViewMode('GROUPED')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                ticketViewMode === 'GROUPED'
                  ? 'bg-white dark:bg-[#1E293B] text-navy-950 dark:text-white shadow-sm font-bold'
                  : 'text-stone-600 dark:text-slate-400 hover:text-navy-950 dark:hover:text-white'
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
                  ? 'bg-white dark:bg-[#1E293B] text-navy-950 dark:text-white shadow-sm font-bold'
                  : 'text-stone-600 dark:text-slate-400 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-brand-600" />
              <span>All Seats ({tickets.length})</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-56 bg-stone-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-12 h-12 text-stone-400" />}
          title="No Tickets Found"
          description="You don't have any event tickets issued yet. Explore our curated events and book your passes."
          actionText="Discover Events"
          actionHref="/events"
        />
      ) : ticketViewMode === 'GROUPED' ? (
        /* Consolidated Passes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedPasses.map((group) => {
            const firstTicket = group.tickets[0];
            const totalGroupPrice = group.price * group.tickets.length;

            return (
              <div
                key={group.key}
                className={`p-6 rounded-3xl border bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between transition-all ${
                  group.status === 'VALID'
                    ? 'border-stone-300 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500'
                    : group.status === 'CHECKED_IN'
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/10 dark:bg-emerald-950/20'
                    : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/10 dark:bg-rose-950/20 opacity-70'
                }`}
              >
                {/* Top Row */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block">
                        {group.ticketTypeName}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white mt-0.5 line-clamp-1">
                        {group.eventName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800 gap-1 text-[11px] font-bold"
                        >
                          <Users className="w-3 h-3" />
                          {group.tickets.length} {group.tickets.length === 1 ? 'SEAT' : 'SEATS'}
                        </Badge>
                        <span className="font-mono text-xs text-stone-500 dark:text-slate-400">
                          {firstTicket.ticketNumber}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        group.status === 'VALID'
                          ? 'success'
                          : group.status === 'CHECKED_IN'
                          ? 'brand'
                          : 'danger'
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {group.status === 'VALID' ? 'Booked' : group.status}
                    </Badge>
                  </div>

                  {/* Allocated Seats Chips */}
                  <div className="mt-3 bg-stone-50/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-stone-200/80 dark:border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Armchair className="w-3.5 h-3.5 text-brand-600" />
                      Assigned Seats ({group.tickets.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.tickets.map((t, idx) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white dark:bg-[#1E293B] border border-stone-200 dark:border-slate-700 rounded-lg text-xs font-mono text-stone-700 dark:text-slate-200 font-medium"
                        >
                          <Armchair className="w-3 h-3 text-stone-400" />
                          {t.seatNumber || `Seat ${idx + 1}`}
                          <span className="text-[10px] text-stone-400">
                            (#{t.ticketNumber.slice(-4)})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Event Time & Venue */}
                  <div className="space-y-1.5 py-3 mt-2 border-t border-stone-100 dark:border-slate-800 text-xs text-stone-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{group.eventStartDate ? formatDate(group.eventStartDate) : 'Date TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        {group.venueName ? `${group.venueName}, ` : ''}
                        {group.city || 'Virtual'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block">
                      Holder • {group.tickets.length > 1 ? `Total (${group.tickets.length} seats)` : 'Price'}
                    </span>
                    <span className="text-xs font-semibold text-stone-800 dark:text-slate-200 block">
                      {group.attendeeName}
                    </span>
                    <span className="text-xs font-bold text-navy-950 dark:text-white">
                      {formatCurrency(totalGroupPrice)}
                      {group.tickets.length > 1 && (
                        <span className="font-normal text-[11px] text-stone-400 dark:text-slate-400 ml-1">
                          ({formatCurrency(group.price)}/ea)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setSelectedGroupForQR({
                          group,
                          selectedSeatIndex: 0,
                        })
                      }
                      className="gap-1.5 text-xs font-semibold shadow-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View QR Pass</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Individual Seats Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((t, idx) => (
            <div
              key={t.id}
              className={`p-6 rounded-3xl border bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between transition-all ${
                t.status === 'VALID'
                  ? 'border-stone-300 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500'
                  : t.status === 'CHECKED_IN'
                  ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/10 dark:bg-emerald-950/20'
                  : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/10 dark:bg-rose-950/20 opacity-70'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block">
                    {t.ticketTypeName}
                  </span>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white mt-0.5 line-clamp-1">
                    {t.eventName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-semibold text-stone-500 dark:text-slate-400">
                      {t.ticketNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 dark:text-brand-300 font-semibold">
                      <Armchair className="w-3 h-3" />
                      {t.seatNumber || `Seat ${idx + 1}`}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    t.status === 'VALID'
                      ? 'success'
                      : t.status === 'CHECKED_IN'
                      ? 'brand'
                      : 'danger'
                  }
                  className="text-[10px] uppercase font-bold"
                >
                  {t.status === 'VALID' ? 'Booked' : t.status}
                </Badge>
              </div>

              {/* Event time & venue */}
              <div className="space-y-1.5 py-3 border-y border-stone-100 dark:border-slate-800 text-xs text-stone-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{formatDate(t.eventStartDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    {t.venueName ? `${t.venueName}, ` : ''}
                    {t.city || 'Virtual'}
                  </span>
                </div>
              </div>

              {/* Bottom bar & QR preview trigger */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block">
                    Holder
                  </span>
                  <span className="text-xs font-semibold text-stone-800 dark:text-slate-200">{t.attendeeName}</span>
                  <span className="block text-xs font-bold text-navy-950 dark:text-white mt-0.5">
                    {formatCurrency(t.price)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSingleTicketForQR(t)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <QrCode className="w-4 h-4 text-brand-600" />
                    <span>View QR Code</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped QR Pass Modal Dialog */}
      {selectedGroupForQR && (
        <Dialog
          isOpen={!!selectedGroupForQR}
          onClose={() => setSelectedGroupForQR(null)}
          title={`Digital Admission Pass: ${selectedGroupForQR.group.ticketTypeName}`}
          description={selectedGroupForQR.group.eventName}
        >
          {(() => {
            const { group, selectedSeatIndex } = selectedGroupForQR;
            const currentTicket = group.tickets[selectedSeatIndex] || group.tickets[0];

            return (
              <div className="flex flex-col items-center justify-center p-2 space-y-4">
                {/* Multi-seat switcher pills */}
                {group.tickets.length > 1 && (
                  <div className="w-full bg-stone-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-stone-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-brand-600" />
                        Select Seat ({group.tickets.length} Seats)
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500">
                        Click seat to show its gate pass
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {group.tickets.map((t, idx) => {
                        const isSelected = idx === selectedSeatIndex;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              setSelectedGroupForQR({
                                group,
                                selectedSeatIndex: idx,
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-300 font-bold'
                                : 'bg-white dark:bg-[#1E293B] text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-700'
                            }`}
                          >
                            <Armchair className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                            <span>{t.seatNumber || `Seat ${idx + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-md flex flex-col items-center">
                  {currentTicket.qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentTicket.qrCodeUrl}
                      alt={`QR code for ${currentTicket.ticketNumber}`}
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <QrCode className="w-48 h-48 text-stone-300" />
                  )}
                  <span className="font-mono text-xs text-stone-700 font-semibold mt-2">
                    {currentTicket.seatNumber || `Seat ${selectedSeatIndex + 1}`} • {currentTicket.ticketNumber}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Scan at venue entrance gate
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <span className="text-xs text-stone-600 dark:text-slate-400 block">
                    Tier: <strong className="text-stone-900 dark:text-white">{group.ticketTypeName}</strong> • {currentTicket.attendeeName}
                  </span>
                  <div className="pt-1">
                    <Badge
                      variant={
                        currentTicket.status === 'VALID'
                          ? 'success'
                          : currentTicket.status === 'CHECKED_IN'
                          ? 'warning'
                          : 'danger'
                      }
                      className="text-xs font-bold uppercase"
                    >
                      Status: {currentTicket.status}
                    </Badge>
                  </div>
                </div>

                <div className="w-full pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
                  <Link href={`/bookings/${group.bookingId}`}>
                    <Button variant="outline" size="sm">
                      View Full Booking
                    </Button>
                  </Link>
                  <Button variant="primary" size="sm" onClick={() => window.print()} className="gap-1.5">
                    <Printer className="w-4 h-4" />
                    <span>Print Pass</span>
                  </Button>
                </div>
              </div>
            );
          })()}
        </Dialog>
      )}

      {/* Single Ticket QR Modal Dialog for individual view */}
      {selectedSingleTicketForQR && (
        <Dialog
          isOpen={!!selectedSingleTicketForQR}
          onClose={() => setSelectedSingleTicketForQR(null)}
          title={`Digital Ticket Pass: ${selectedSingleTicketForQR.ticketNumber}`}
          description={selectedSingleTicketForQR.eventName}
        >
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-md">
              {selectedSingleTicketForQR.qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedSingleTicketForQR.qrCodeUrl}
                  alt={`QR code for ${selectedSingleTicketForQR.ticketNumber}`}
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <QrCode className="w-48 h-48 text-stone-300" />
              )}
            </div>

            <div className="text-center space-y-1">
              <span className="font-mono text-sm font-bold text-stone-900 dark:text-white block">
                {selectedSingleTicketForQR.ticketNumber}
              </span>
              <span className="text-xs text-stone-500 dark:text-slate-400 block">
                Tier: {selectedSingleTicketForQR.ticketTypeName} • {selectedSingleTicketForQR.seatNumber || 'Standard'} • {selectedSingleTicketForQR.attendeeName}
              </span>
              <div className="pt-2">
                <Badge
                  variant={
                    selectedSingleTicketForQR.status === 'VALID'
                      ? 'success'
                      : selectedSingleTicketForQR.status === 'CHECKED_IN'
                      ? 'warning'
                      : 'danger'
                  }
                  className="text-xs font-bold uppercase"
                >
                  Status: {selectedSingleTicketForQR.status}
                </Badge>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
              <Link href={`/bookings/${selectedSingleTicketForQR.bookingId}`}>
                <Button variant="outline" size="sm">
                  View Full Booking
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={() => window.print()} className="gap-1.5">
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
