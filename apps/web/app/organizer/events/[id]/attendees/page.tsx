'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  ArrowLeft,
  Users,
  Camera,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export default function EventAttendeesAndCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // Scanner & Lookup State
  const [tokenInput, setTokenInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [lastCheckInResult, setLastCheckInResult] = useState<{
    status: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'INVALID' | 'CANCELLED';
    message: string;
    ticket?: any;
  } | null>(null);

  // Fetch attendees and check-in stats
  const { data: rosterData, isLoading, refetch } = useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: () => api.get<{ data: any }>(`/organizer/events/${eventId}/attendees`),
  });

  const roster = rosterData?.data;
  const attendees: any[] = roster?.attendees || [];
  const totalAttendees = roster?.totalAttendees || 0;
  const checkedInCount = roster?.checkedInCount || 0;
  const checkInRate = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;

  // Atomic Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (ticketToken: string) =>
      api.post<{ message: string; data: any }>('/tickets/check-in', { ticketToken }),
    onSuccess: (res) => {
      setLastCheckInResult({
        status: 'SUCCESS',
        message: res.message || 'Check-in confirmed!',
        ticket: res.data,
      });
      toast.success(`Check-in Confirmed: ${res.data.attendeeName} (${res.data.ticketTypeName})`);
      setTokenInput('');
      refetch();
    },
    onError: (err: any) => {
      if (err.status === 409) {
        setLastCheckInResult({
          status: 'ALREADY_CHECKED_IN',
          message: err.message || 'Ticket has already been checked in. Duplicate check-ins are blocked.',
        });
        toast.warning('Duplicate check-in blocked!');
      } else {
        setLastCheckInResult({
          status: 'INVALID',
          message: err.message || 'Invalid or cancelled ticket.',
        });
        toast.error(err.message || 'Invalid ticket');
      }
    },
  });

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    checkInMutation.mutate(tokenInput.trim());
  };

  const filteredAttendees = attendees.filter(
    (a) =>
      a.attendeeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.attendeeEmail.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.ticketNumber.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <button
            onClick={() => router.push('/organizer/events')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Managed Events</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-navy-950">
              Live Check-In Desk & Attendee Roster
            </h1>
          </div>
          <span className="text-xs text-stone-500 mt-1 block">
            {roster?.event?.title || 'Event Roster'} • {roster?.event?.startDate ? formatDate(roster.event.startDate) : ''}
          </span>
        </div>
      </div>

      {/* Check-In Progress KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
              Total Confirmed Attendees
            </span>
            <span className="text-3xl font-extrabold text-navy-950 mt-1 block">
              {totalAttendees}
            </span>
            <span className="text-xs text-stone-400 mt-1 block">Seats issued</span>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
              Checked In at Door
            </span>
            <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">
              {checkedInCount}
            </span>
            <span className="text-xs text-stone-400 mt-1 block">Admitted guests</span>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
              Admission Progress
            </span>
            <span className="text-3xl font-extrabold text-brand-600 mt-1 block">
              {checkInRate}%
            </span>
            <div className="w-full bg-stone-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${checkInRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Check-in Scanner Station (Left) & Attendee Roster Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: QR Code Scanner & Token Lookup */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-stone-200 shadow-md">
            <CardHeader className="bg-stone-50/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-4 h-4 text-brand-600" />
                <span>Ticket Validation Scanner</span>
              </CardTitle>
              <p className="text-xs text-stone-500 mt-0.5">
                Scan attendee QR code or paste ticket reference.
              </p>
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
              {/* Check-In Result Banner */}
              {lastCheckInResult && (
                <div
                  className={`p-4 rounded-2xl border transition-all animate-in zoom-in-95 duration-150 ${
                    lastCheckInResult.status === 'SUCCESS'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : lastCheckInResult.status === 'ALREADY_CHECKED_IN'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {lastCheckInResult.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : lastCheckInResult.status === 'ALREADY_CHECKED_IN' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 text-xs">
                      <div className="font-bold text-sm mb-1">
                        {lastCheckInResult.status === 'SUCCESS'
                          ? 'Valid Ticket — Admitted!'
                          : lastCheckInResult.status === 'ALREADY_CHECKED_IN'
                          ? 'Duplicate Check-In Detected!'
                          : 'Invalid / Rejected Ticket'}
                      </div>
                      <p>{lastCheckInResult.message}</p>

                      {lastCheckInResult.ticket && (
                        <div className="mt-2 pt-2 border-t border-emerald-200 space-y-0.5 font-medium">
                          <div>Guest: {lastCheckInResult.ticket.attendeeName}</div>
                          <div>Tier: {lastCheckInResult.ticket.ticketTypeName}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Input Form for Scanned Token or Ticket Number */}
              <form onSubmit={handleManualCheckIn} className="space-y-3">
                <Input
                  label="Scan or Enter Ticket Token / Ref"
                  placeholder="Paste QR payload, UUID, or TKT-..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoFocus
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={checkInMutation.isPending}
                  disabled={!tokenInput.trim()}
                  className="w-full gap-2 font-bold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validate & Check In</span>
                </Button>
              </form>

              {/* Helpful Demo Tip */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-500">
                <span className="font-semibold text-stone-700 block mb-1">Placement Demo Note:</span>
                Click any attendee row on the right to auto-fill their token for instant test validation.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Full Attendee Roster Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-stone-200">
            <CardHeader className="bg-stone-50/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>Attendee List ({filteredAttendees.length})</span>
                </CardTitle>

                {/* Filter input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search attendee or ticket..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-xl focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-stone-400">Loading roster...</div>
              ) : filteredAttendees.length === 0 ? (
                <div className="p-8 text-center text-sm text-stone-500">
                  No attendees found matching filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Attendee</th>
                        <th className="py-3 px-4">Tier</th>
                        <th className="py-3 px-4">Ticket Number</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredAttendees.map((att) => (
                        <tr
                          key={att.ticketId}
                          onClick={() => setTokenInput(att.ticketToken)}
                          className="hover:bg-brand-50/20 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-stone-900 block">
                              {att.attendeeName}
                            </span>
                            <span className="text-stone-400 text-[11px] block">{att.attendeeEmail}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-stone-700">
                            {att.ticketTypeName}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-stone-600">
                            {att.ticketNumber}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                att.status === 'VALID'
                                  ? 'default'
                                  : att.status === 'CHECKED_IN'
                                  ? 'success'
                                  : 'danger'
                              }
                              className="text-[10px] font-bold"
                            >
                              {att.status}
                            </Badge>
                            {att.checkedInAt && (
                              <span className="text-[10px] text-emerald-700 block mt-0.5">
                                {formatDate(att.checkedInAt, { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {att.status === 'VALID' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  checkInMutation.mutate(att.ticketToken);
                                }}
                                className="text-xs px-2.5 py-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              >
                                Check In
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
