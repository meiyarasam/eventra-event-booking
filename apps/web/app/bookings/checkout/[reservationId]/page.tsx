'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { ReservationDTO } from '@eventra/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Calendar,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.reservationId as string;

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const UPI_ID = 'eventra.tickets@icici';

  // Fetch active reservation details from API
  const { data: resData, isLoading, isError } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () =>
      api.get<{ data: ReservationDTO & { event: any } }>(
        `/bookings/reservations/${reservationId}`
      ),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.data?.status !== 'ACTIVE') return false;
      return 15000;
    },
  });

  const reservation = resData?.data;

  // Countdown timer effect
  useEffect(() => {
    if (!reservation?.expiresAt) return;

    const interval = setInterval(() => {
      const expires = new Date(reservation.expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        clearInterval(interval);
        toast.error('Your 10-minute ticket reservation has expired.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation?.expiresAt]);

  // If reservation is already confirmed (e.g. user clicked Back after completing payment),
  // prevent returning to payment screen and cleanly navigate backward to the event page or bookings list
  useEffect(() => {
    if (!reservation) return;
    if (reservation.status === 'CONFIRMED' || (reservation as any).booking) {
      const returnTarget = (reservation as any).event?.slug
        ? `/events/${(reservation as any).event.slug}`
        : (reservation as any).eventId
        ? `/events/${(reservation as any).eventId}`
        : '/bookings';
      router.replace(returnTarget);
    }
  }, [reservation, router]);

  // Payment Confirmation Mutation
  const paymentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/bookings/pay', payload),
    onSuccess: (data: any) => {
      toast.success('Payment confirmed! Your ticket is Booked.');
      const bookingId = data?.data?.booking?.id || data?.data?.id;
      if (bookingId) {
        router.replace(`/bookings/${bookingId}?success=true`);
      } else {
        router.replace('/bookings');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Payment confirmation failed. Please try again.');
    },
  });

  const handleConfirmPayment = () => {
    if (secondsRemaining !== null && secondsRemaining <= 0) {
      toast.error('Reservation expired. Please select tickets again.');
      return;
    }

    paymentMutation.mutate({
      reservationId,
      paymentMethod: 'UPI',
      simulateSuccess: true,
      paymentDetails: {
        upiId: 'customer@upi',
      },
    });
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-10 w-1/3 bg-stone-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-64 bg-stone-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (isError || !reservation) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 inline-block">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">Reservation Not Found or Expired</h2>
        <p className="text-sm text-stone-500 dark:text-slate-400">
          This reservation may have expired or does not belong to your account.
        </p>
        <Button onClick={() => router.push('/events')}>Find Other Events</Button>
      </div>
    );
  }

  // Safety Guard: if this reservation is already confirmed, block checkout and provide link to view booking
  if (reservation.status === 'CONFIRMED' || (reservation as any).booking) {
    const confirmedBookingId = (reservation as any).booking?.id;
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Booking Already Completed</h2>
        <p className="text-sm text-stone-600 dark:text-slate-300">
          This reservation is already paid and marked as <strong>Booked</strong>. Duplicate payments are prevented.
        </p>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          {confirmedBookingId ? (
            <Button onClick={() => router.replace(`/bookings/${confirmedBookingId}`)}>
              View Your Ticket Pass
            </Button>
          ) : (
            <Button onClick={() => router.replace('/bookings')}>
              Go to My Bookings
            </Button>
          )}
          <Button variant="outline" onClick={() => router.replace('/events')}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = Number(reservation.totalAmount || 0);
  const formattedAmount = formatCurrency(totalAmount);
  const isExpired =
    (secondsRemaining !== null && secondsRemaining <= 0) || reservation.status === 'EXPIRED';

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Generate dynamic standard UPI QR URL with the exact total ticket amount
  const upiQrPayload = `upi://pay?pa=${UPI_ID}&pn=EVENTRA+Ticketing&am=${totalAmount.toFixed(
    2
  )}&cu=INR&tn=Booking+${reservation.id}&tr=${reservation.id}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Expiration Countdown Banner */}
      <div
        className={`mb-8 p-5 rounded-2xl border flex items-center justify-between transition-colors shadow-sm ${
          isExpired
            ? 'bg-rose-600 border-rose-700 text-white'
            : (secondsRemaining || 600) < 120
            ? 'bg-amber-500 text-white border-amber-600 shadow-md animate-pulse'
            : 'bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 text-white border-brand-600 shadow-md'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base block">
              {isExpired
                ? 'Reservation Expired — Capacity Released'
                : 'Ticket Inventory Held Exclusively For You'}
            </span>
            <span className="text-xs text-white/90">
              {isExpired
                ? 'Your 10-minute hold window ended. Please re-select tickets.'
                : 'Scan the dynamic QR code below to complete payment before countdown ends.'}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono text-3xl font-black text-white drop-shadow-sm">
            {secondsRemaining !== null ? formatTimer(secondsRemaining) : '10:00'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Direct Scan & Pay UPI QR Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-stone-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-stone-100 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/60 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-brand-500" />
                    <span>Scan & Pay via UPI</span>
                  </CardTitle>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                    Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Merchant</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Dynamic Amount Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-navy-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                    Total Amount Due for Tickets
                  </span>
                  <div className="text-3xl font-black text-amber-400 font-mono tracking-tight mt-0.5">
                    {formattedAmount}
                  </div>
                  <span className="text-xs text-stone-300 block mt-0.5">
                    For {reservation.items.reduce((sum, item) => sum + item.quantity, 0)} reserved ticket(s)
                  </span>
                </div>

                <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                    Merchant Name
                  </span>
                  <span className="text-xs font-bold text-white block">EVENTRA Ticketing Pvt Ltd</span>
                  <span className="font-mono text-[11px] text-stone-400 block mt-0.5">
                    Ref: {reservation.id.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Dynamic QR Code Centerpiece */}
              <div className="flex flex-col items-center justify-center p-6 bg-stone-50/80 dark:bg-slate-900/60 rounded-3xl border border-stone-200/90 dark:border-slate-800 text-center relative">
                {/* QR Code Container (Kept clean white background for flawless optical scannability) */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-md relative group">
                  <QRCodeSVG
                    value={upiQrPayload}
                    size={220}
                    level="H"
                    includeMargin={true}
                    className="rounded-lg"
                  />
                  {/* Subtle Center Brand Icon */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Amount Pill Below QR */}
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 text-xs font-bold shadow-sm">
                  <Smartphone className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Scan to pay exact amount: {formattedAmount}</span>
                </div>

                <p className="text-xs text-stone-500 dark:text-slate-400 mt-2 max-w-sm">
                  Amount is dynamically encoded in this QR code. Scanning will automatically pre-fill{' '}
                  <strong className="text-stone-800 dark:text-white">{formattedAmount}</strong> in your UPI app.
                </p>

                {/* Supported Apps Chips */}
                <div className="mt-4 pt-4 border-t border-stone-200/70 dark:border-slate-800 w-full flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="text-[11px] text-stone-400 dark:text-slate-500 font-semibold uppercase tracking-wider mr-1">
                    Works With:
                  </span>
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-stone-700 dark:text-slate-200 font-medium">
                    Google Pay
                  </span>
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-stone-700 dark:text-slate-200 font-medium">
                    PhonePe
                  </span>
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-stone-700 dark:text-slate-200 font-medium">
                    Paytm
                  </span>
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-stone-700 dark:text-slate-200 font-medium">
                    BHIM UPI
                  </span>
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-stone-700 dark:text-slate-200 font-medium">
                    Cred
                  </span>
                </div>
              </div>

              {/* UPI ID Quick Copy Box */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-slate-500 tracking-wider">
                    Or Pay to UPI ID (VPA)
                  </span>
                  <div className="font-mono font-bold text-stone-900 dark:text-white text-sm">{UPI_ID}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyUpiId}
                  className="gap-1.5 text-xs font-semibold shrink-0"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
                      <span>Copy UPI ID</span>
                    </>
                  )}
                </Button>
              </div>

              {/* I Have Paid Confirmation Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={isExpired || paymentMutation.isPending}
                  isLoading={paymentMutation.isPending}
                  onClick={handleConfirmPayment}
                  className="w-full text-base font-bold shadow-lg py-4 bg-gradient-to-r from-emerald-600 via-brand-600 to-emerald-600 hover:from-emerald-700 hover:to-brand-700 text-white rounded-2xl gap-2 border-0 transition-transform active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {paymentMutation.isPending
                      ? `Confirming Booking...`
                      : `I Have Paid`}
                  </span>
                </Button>
                <p className="text-center text-[11px] text-stone-500 dark:text-slate-400 mt-2">
                  Click after completing your payment to instantly confirm your booking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-stone-200 dark:border-slate-800 shadow-sm sticky top-24">
            <CardHeader className="bg-stone-50/50 dark:bg-slate-900/60 pb-4 border-b border-stone-100 dark:border-slate-800">
              <CardTitle className="text-base text-stone-900 dark:text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Event Mini Details */}
              {reservation.event && (
                <div className="pb-4 border-b border-stone-100 dark:border-slate-800">
                  <h4 className="font-serif font-bold text-stone-900 dark:text-white text-sm leading-snug">
                    {reservation.event.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 mt-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                    <span>
                      {formatDate(reservation.event.startDate, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                    <span>
                      {reservation.event.city || (reservation.event.isOnline ? 'Online' : 'TBA')}
                    </span>
                  </div>
                </div>
              )}

              {/* Reserved Items */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-stone-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Reserved Ticket Types
                </span>
                {reservation.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-slate-200">{item.ticketTypeName}</span>
                      <span className="text-stone-400 dark:text-slate-500 ml-1.5">× {item.quantity}</span>
                    </div>
                    <span className="font-medium text-stone-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-stone-900 dark:text-white font-medium">{formattedAmount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                  <span>Platform Fee</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Free (₹0.00)</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-navy-950 dark:text-white pt-2 border-t border-stone-100 dark:border-slate-800">
                  <span>Amount to Pay</span>
                  <span className="text-brand-600 dark:text-brand-400 font-mono text-lg">{formattedAmount}</span>
                </div>
              </div>

              {/* Security Note */}
              <div className="pt-2">
                <div className="p-3 bg-stone-50 dark:bg-slate-900/60 rounded-xl border border-stone-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-stone-500 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>256-bit encrypted checkout with instant ticket issuance.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
