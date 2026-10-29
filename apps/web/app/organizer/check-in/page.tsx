'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scan,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Ticket,
  User,
  RotateCcw,
} from 'lucide-react';

export default function UniversalOrganizerCheckInPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'INVALID' | 'CANCELLED';
    message: string;
    ticket?: any;
  } | null>(null);

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (tokenOrNumber: string) =>
      api.post<{ message: string; data: any }>('/tickets/check-in', { ticketToken: tokenOrNumber }),
    onSuccess: (res) => {
      setScanResult({
        status: 'VALID',
        message: res.message || 'Pass Verified & Checked In Successfully!',
        ticket: res.data,
      });
      toast.success('Attendee checked in successfully');
      setTokenInput('');
    },
    onError: (err: any) => {
      const msg = err.message || 'Ticket validation failed';
      if (msg.includes('already been checked in')) {
        setScanResult({
          status: 'ALREADY_CHECKED_IN',
          message: msg,
        });
        toast.error('Pass already checked in');
      } else {
        setScanResult({
          status: 'INVALID',
          message: msg,
        });
        toast.error(msg);
      }
    },
  });

  const handleValidateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    checkInMutation.mutate(tokenInput.trim());
  };

  const resetScanner = () => {
    setScanResult(null);
    setTokenInput('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organizer Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Gate QR Check-In Scanner</h1>
            <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
              Verify and atomically mark attendee passes as checked-in at entrance gates.
            </p>
          </div>
          <Badge variant="brand" className="gap-1.5 text-xs font-bold uppercase tracking-wider py-1 px-3">
            <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Staff Scanner Mode</span>
          </Badge>
        </div>
      </div>

      {/* Main Scanner Box */}
      <Card className="border-stone-200 dark:border-slate-800 shadow-lg overflow-hidden">
        <div className="bg-navy-950 dark:bg-slate-900 p-8 text-center text-white relative">
          <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 relative">
            <Scan className="w-12 h-12 text-brand-400 animate-pulse" />
            <div className="absolute inset-0 rounded-3xl border-2 border-brand-500 animate-ping opacity-20 pointer-events-none" />
          </div>
          <h2 className="font-serif text-xl font-bold">Ready to Scan Passes</h2>
          <p className="text-xs text-stone-400 dark:text-slate-400 max-w-md mx-auto mt-1">
            Aim optical scanner at attendee QR code or paste / enter the unique ticket reference number below.
          </p>
        </div>

        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleValidateScan} className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste QR payload (e.g. {ticketToken:...}) or enter TKT-..."
                  className="font-mono text-sm pl-4 pr-10"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                isLoading={checkInMutation.isPending}
                className="gap-2 font-semibold px-6 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validate & Check In</span>
              </Button>
            </div>
          </form>

          {/* Validation Result Box */}
          {scanResult && (
            <div
              className={`p-6 rounded-2xl border transition-all ${
                scanResult.status === 'VALID'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : scanResult.status === 'ALREADY_CHECKED_IN'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    scanResult.status === 'VALID'
                      ? 'bg-emerald-600 text-white'
                      : scanResult.status === 'ALREADY_CHECKED_IN'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {scanResult.status === 'VALID' ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : scanResult.status === 'ALREADY_CHECKED_IN' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base block">
                      {scanResult.status === 'VALID'
                        ? 'Valid Ticket — Admission Granted'
                        : scanResult.status === 'ALREADY_CHECKED_IN'
                        ? 'Pass Already Used (Duplicate Entry)'
                        : 'Invalid Pass — Access Denied'}
                    </span>
                    <Badge
                      variant={
                        scanResult.status === 'VALID'
                          ? 'success'
                          : scanResult.status === 'ALREADY_CHECKED_IN'
                          ? 'warning'
                          : 'danger'
                      }
                      className="text-xs font-bold"
                    >
                      {scanResult.status}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-90">{scanResult.message}</p>

                  {scanResult.ticket && (
                    <div className="pt-3 mt-3 border-t border-black/10 dark:border-white/10 text-xs space-y-1 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Attendee:</span>
                        <span>{scanResult.ticket.attendeeName || 'Registered Attendee'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Ticket Tier:</span>
                        <span>{scanResult.ticket.ticketTypeName || 'General Admission'}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-semibold">Ticket #:</span>
                        <span>{scanResult.ticket.ticketNumber}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex justify-end">
                <Button variant="outline" size="sm" onClick={resetScanner} className="gap-1.5 text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Next Attendee</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
