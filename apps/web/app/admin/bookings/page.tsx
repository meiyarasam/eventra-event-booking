'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Send,
  Eye,
  ArrowLeft,
  X,
  Calendar,
  User,
  ShieldAlert,
  Download,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings', search, statusFilter],
    queryFn: () =>
      api.get<{ data: any[]; meta: any }>(
        `/admin/bookings?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`
      ),
  });

  const bookings = data?.data || [];

  const resendEmailMutation = useMutation({
    mutationFn: (bookingId: string) => api.post(`/bookings/${bookingId}/resend-email`),
    onSuccess: () => {
      toast.success('Digital ticket confirmation email sent successfully.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to dispatch ticket email.');
    },
  });

  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;
  const totalVolume = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2">
            <Link href="/admin" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Control Panel</span>
            </Link>
            <span>/</span>
            <span>Bookings & Tickets</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-slate-100 flex items-center gap-3">
            <span>Platform Bookings & Passes</span>
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-brand-500/30 text-brand-500">
              {bookings.length} Total
            </Badge>
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            Global ticket reservations, attendee pass records, automated email dispatches, and QR status audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Link href="/admin">
            <Button variant="secondary" size="sm" className="gap-2">
              <span>Overview Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                Confirmed Bookings
              </span>
              <span className="text-2xl font-bold text-navy-950 dark:text-slate-100 mt-1 block">
                {confirmedCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                Gross Ticket Volume
              </span>
              <span className="text-2xl font-bold text-navy-950 dark:text-slate-100 mt-1 block">
                {formatCurrency(totalVolume)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                Cancelled / Voided
              </span>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                {cancelledCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, attendee, email, or event title..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CONFIRMED', 'CANCELLED', 'PENDING'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 dark:bg-slate-800/60 border-b border-stone-200 dark:border-slate-800 text-stone-500 dark:text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Booking Reference</th>
                <th className="px-5 py-3.5">Event</th>
                <th className="px-5 py-3.5">Attendee</th>
                <th className="px-5 py-3.5">Passes</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-500 dark:text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    <span>Loading platform bookings...</span>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-500 dark:text-slate-400">
                    <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-base text-stone-700 dark:text-slate-300">No bookings match criteria</p>
                    <p className="text-xs text-stone-400 mt-1">Try adjusting your search terms or filter.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b: any) => {
                  const statusColors: Record<string, string> = {
                    CONFIRMED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                    CANCELLED: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
                    PENDING: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                  };

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-xs text-stone-900 dark:text-slate-100">
                        {b.bookingReference}
                      </td>
                      <td className="px-5 py-4 font-medium text-stone-900 dark:text-slate-100 max-w-[220px] truncate">
                        {b.event?.title || 'Platform Event'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-stone-900 dark:text-slate-200">{b.user?.name || 'Attendee'}</div>
                        <div className="text-xs text-stone-400">{b.user?.email}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-800 dark:text-slate-300">
                        {b.ticketsCount || b.tickets?.length || 1} pass(es)
                      </td>
                      <td className="px-5 py-4 font-bold text-stone-900 dark:text-slate-100">
                        {formatCurrency(Number(b.totalAmount))}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            statusColors[b.status] || 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500 dark:text-slate-400">
                        {formatDate(b.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setIsInspectOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-500 dark:text-slate-400 hover:text-brand-600 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                            title="Inspect Tickets & QR Codes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => resendEmailMutation.mutate(b.id)}
                              disabled={resendEmailMutation.isPending}
                              className="p-1.5 rounded-lg text-stone-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                              title="Resend Digital Ticket Confirmation Email"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ticket Inspection Modal Dialog */}
      {isInspectOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-navy-950 dark:text-slate-100">
                    Booking Pass Oversight
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Ref: {selectedBooking.bookingReference}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInspectOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-stone-50 dark:bg-slate-800/50 p-4 rounded-xl border border-stone-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-stone-400 block font-medium">Event</span>
                <span className="font-bold text-stone-900 dark:text-slate-100">{selectedBooking.event?.title}</span>
              </div>
              <div>
                <span className="text-xs text-stone-400 block font-medium">Attendee</span>
                <span className="font-bold text-stone-900 dark:text-slate-100">{selectedBooking.user?.name}</span>
                <span className="text-xs text-stone-500 block">{selectedBooking.user?.email}</span>
              </div>
              <div>
                <span className="text-xs text-stone-400 block font-medium">Total Settled</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {formatCurrency(Number(selectedBooking.totalAmount))}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-400 block font-medium">Booking Status</span>
                <span className="font-bold uppercase text-xs">{selectedBooking.status}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Issued Digital Tickets ({selectedBooking.tickets?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedBooking.tickets?.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-stone-900 dark:text-slate-100">
                        {t.ticketNumber}
                      </div>
                      <div className="text-stone-500 text-[11px] mt-0.5">
                        Tier: <span className="font-semibold text-stone-800 dark:text-slate-200">{t.ticketTypeName}</span> • Price: {formatCurrency(t.price)}
                      </div>
                    </div>
                    <div>
                      <Badge
                        variant={t.status === 'VALID' ? 'success' : 'danger'}
                        className="text-[10px] font-bold"
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-stone-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInspectOpen(false)}
              >
                Close Oversight
              </Button>
              {selectedBooking.status === 'CONFIRMED' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-2 font-bold"
                  onClick={() => {
                    resendEmailMutation.mutate(selectedBooking.id);
                  }}
                  isLoading={resendEmailMutation.isPending}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Resend Confirmation Email</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
