'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EventDTO, EventStatus } from '@eventra/shared';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import {
  Calendar,
  Plus,
  Send,
  Globe,
  Users,
  QrCode,
  XCircle,
  Eye,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function OrganizerEventsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [cancelModalEvent, setCancelModalEvent] = useState<EventDTO | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch organizer's events
  const { data: eventsData, isLoading, refetch } = useQuery({
    queryKey: ['organizer-events', selectedStatus],
    queryFn: () =>
      api.get<{ data: EventDTO[] }>('/organizer/events', {
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      }),
  });

  const events = eventsData?.data || [];

  // Submit for Approval Mutation
  const submitMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/events/${eventId}/submit`),
    onSuccess: () => {
      toast.success('Event submitted to admin moderation queue.');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Submission failed');
    },
  });

  // Publish Approved Event Mutation
  const publishMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/events/${eventId}/publish`),
    onSuccess: () => {
      toast.success('Event is now LIVE and bookable in the public catalog!');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Publishing failed');
    },
  });

  // Cancel Event Mutation
  const cancelMutation = useMutation({
    mutationFn: (payload: { eventId: string; reason: string }) =>
      api.post(`/events/${payload.eventId}/cancel`, { reason: payload.reason }),
    onSuccess: () => {
      toast.success('Event cancelled. Booked attendees have been notified.');
      setCancelModalEvent(null);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cancellation failed');
    },
  });

  const statusBadgeVariant = (status: EventStatus) => {
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'success';
      case EventStatus.APPROVED:
        return 'brand';
      case EventStatus.PENDING_APPROVAL:
        return 'warning';
      case EventStatus.REJECTED:
      case EventStatus.CANCELLED:
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">My Managed Events</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            Review event status, submit drafts for review, and launch check-in scanners.
          </p>
        </div>

        <Link href="/organizer/events/new">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200 dark:border-slate-800">
        {[
          { key: 'ALL', label: 'All Statuses' },
          { key: EventStatus.PUBLISHED, label: 'Published & Live' },
          { key: EventStatus.APPROVED, label: 'Approved (Ready to Publish)' },
          { key: EventStatus.PENDING_APPROVAL, label: 'Pending Review' },
          { key: EventStatus.DRAFT, label: 'Drafts' },
          { key: EventStatus.REJECTED, label: 'Rejected' },
          { key: EventStatus.CANCELLED, label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === tab.key
                ? 'bg-stone-900 dark:bg-brand-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-stone-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-stone-400 dark:text-slate-500" />}
          title="No Events Found"
          description="You don't have any events matching the selected status filter."
          actionText="Create an Event"
          actionHref="/organizer/events/new"
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const soldCount = event.ticketTypes?.reduce((acc, t) => acc + t.soldQuantity, 0) || 0;

            return (
              <Card key={event.id} className="border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Banner and Info */}
                    <div className="flex items-start gap-4">
                      {event.bannerUrl && (
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-800 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={event.bannerUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadgeVariant(event.status)} className="text-[10px] uppercase font-bold">
                            {event.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-stone-400 dark:text-slate-500 font-medium">
                            {event.category?.name}
                          </span>
                        </div>

                        <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white line-clamp-1">
                          {event.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-slate-400">
                          <span>{formatDate(event.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>{event.city || (event.isOnline ? 'Virtual Live' : 'Location TBA')}</span>
                          <span>•</span>
                          <span className="font-semibold text-stone-800 dark:text-slate-200">
                            {soldCount} / {event.capacity} seats sold
                          </span>
                        </div>

                        {/* Rejection reason banner */}
                        {event.status === EventStatus.REJECTED && event.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 mt-2">
                            <strong>Review Feedback:</strong> {event.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: State Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-slate-800">
                      {/* Check-In Scanner & Attendee Roster */}
                      {(event.status === EventStatus.PUBLISHED || event.status === EventStatus.APPROVED) && (
                        <Link href={`/organizer/events/${event.id}/attendees`}>
                          <Button variant="primary" size="sm" className="gap-1.5">
                            <QrCode className="w-4 h-4" />
                            <span>Scan Passes & Roster</span>
                          </Button>
                        </Link>
                      )}

                      {/* Submit for Review Action */}
                      {(event.status === EventStatus.DRAFT || event.status === EventStatus.REJECTED) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={submitMutation.isPending}
                          onClick={() => submitMutation.mutate(event.id)}
                          className="gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit for Review</span>
                        </Button>
                      )}

                      {/* Publish Approved Event Action */}
                      {event.status === EventStatus.APPROVED && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={publishMutation.isPending}
                          onClick={() => publishMutation.mutate(event.id)}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Publish to Public Catalog</span>
                        </Button>
                      )}

                      {/* View Public Listing */}
                      {event.status === EventStatus.PUBLISHED && (
                        <Link href={`/events/${event.slug || event.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Eye className="w-4 h-4 text-stone-500" />
                            <span>View Page</span>
                          </Button>
                        </Link>
                      )}

                      {/* Cancel Event Action */}
                      {event.status !== EventStatus.CANCELLED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelModalEvent(event)}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Event Modal Dialog */}
      {cancelModalEvent && (
        <Dialog
          isOpen={!!cancelModalEvent}
          onClose={() => setCancelModalEvent(null)}
          title={`Cancel Event: ${cancelModalEvent.title}?`}
          description="Cancelling an event marks all bookings and tickets as void and notifies all registered attendees."
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Cancellation Reason (Shared with booked attendees)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Unforeseen venue maintenance, speaker scheduling conflict..."
                rows={3}
                className="w-full p-3.5 text-sm rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setCancelModalEvent(null)}>
                Keep Event
              </Button>
              <Button
                variant="danger"
                isLoading={cancelMutation.isPending}
                onClick={() =>
                  cancelMutation.mutate({ eventId: cancelModalEvent.id, reason: cancelReason })
                }
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
