'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RotateCcw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Suspense } from 'react';

function BookingFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'Simulated payment was declined by the test bank or timed out.';
  const reservationId = searchParams.get('reservationId');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <Badge variant="danger" className="uppercase font-bold text-xs py-1 px-3">
            Payment Not Completed
          </Badge>
          <h1 className="font-serif text-3xl font-bold text-navy-950 pt-2">
            Checkout Simulation Incomplete
          </h1>
          <p className="text-sm text-stone-600">
            {reason} No charges were simulated on your test payment method.
          </p>
        </div>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold block">What happened?</span>
            <p>
              During evaluation or sandbox testing, selecting &quot;Simulate Decline&quot; tests payment error recovery. 
              Your ticket hold will be released safely if not retried within the reservation window.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link href="/events" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Explore Other Events</span>
              </Button>
            </Link>
            {reservationId && (
              <Link href={`/bookings/checkout/${reservationId}`} className="w-full sm:w-auto">
                <Button variant="primary" className="w-full gap-2 font-semibold">
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Payment</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingFailedPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto p-12 text-center text-stone-500">Loading...</div>}>
      <BookingFailedContent />
    </Suspense>
  );
}
