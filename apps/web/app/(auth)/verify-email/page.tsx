'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandLogo } from '@/components/ui/brand-logo';
import { MailCheck, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Suspense } from 'react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [otpCode, setOtpCode] = useState(tokenFromUrl || '');
  const [email, setEmail] = useState(emailFromUrl);
  const [isVerified, setIsVerified] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (payload: { tokenOrOtp: string; email?: string }) =>
      api.post<{ success: boolean; message: string }>('/auth/verify-email', payload),
    onSuccess: (res) => {
      setIsVerified(true);
      toast.success(res.message || 'Email verified successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Verification failed. Please check the code.');
    },
  });

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenFromUrl && !isVerified) {
      verifyMutation.mutate({ tokenOrOtp: tokenFromUrl, email: emailFromUrl || undefined });
    }
  }, [tokenFromUrl, emailFromUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error('Please enter your 6-digit verification code or token.');
      return;
    }
    verifyMutation.mutate({
      tokenOrOtp: otpCode.trim(),
      email: email.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-block mb-3">
          <BrandLogo size="lg" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-950">
          {isVerified ? 'Email Verified!' : 'Verify Your Email'}
        </h1>
        <p className="text-sm text-stone-500">
          {isVerified
            ? 'Your account has been fully verified. You can now explore events, reserve tickets, or access your dashboard.'
            : 'Enter the 6-digit security code sent to your registered email address.'}
        </p>
      </div>

      <Card className="border-stone-200 shadow-xl overflow-hidden">
        <CardContent className="pt-6">
          {isVerified ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-sm text-stone-600 font-medium">
                Thank you for confirming your email. Your account is in good standing.
              </p>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="primary" className="w-full font-bold shadow-md gap-2">
                    <span>Continue to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 block">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 text-center font-mono text-xl tracking-widest rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                  <span>Demo code: <strong className="text-stone-700 font-mono">123456</strong></span>
                  <Link href="/resend-verification" className="text-brand-600 hover:underline font-semibold">
                    Resend Code
                  </Link>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={verifyMutation.isPending}
                  className="w-full font-bold shadow-md gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Account</span>
                </Button>
              </div>

              <div className="pt-4 text-center">
                <Link href="/login" className="text-xs text-stone-500 hover:text-stone-800 transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-12 text-center text-stone-500">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
