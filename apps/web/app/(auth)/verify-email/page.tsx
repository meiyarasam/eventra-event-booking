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

  const isDemoMode =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_OTP !== 'false' &&
    process.env.NEXT_PUBLIC_MOCK_EMAIL_VERIFICATION !== 'false';

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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-[#FAF9F6] to-slate-100 dark:from-[#0B0F19] dark:via-[#0E1528] dark:to-[#0B0F19] transition-colors">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[300px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none -z-0 animate-float" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[280px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-0 animate-float-slow" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          {/* Illustrative verification badge icon instead of duplicate logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-orange-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <MailCheck className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">
            {isVerified ? 'Email Verified!' : 'Verify Your Email'}
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            {isVerified
              ? 'Your account has been fully verified. You can now explore events, reserve tickets, or access your dashboard.'
              : 'Enter the 6-digit security code sent to your registered email address.'}
          </p>
        </div>

        <Card className="border-stone-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-[#111827]">
          <CardContent className="pt-6">
            {isVerified ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-sm text-stone-600 dark:text-slate-300 font-medium">
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-300 block">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder={isDemoMode ? "123456" : "000000"}
                    className="w-full px-4 py-3.5 text-center font-mono text-2xl tracking-widest font-bold rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all shadow-inner"
                    required
                  />
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 pt-1">
                    {isDemoMode ? (
                      <span>
                        Demo code: <strong className="text-stone-800 dark:text-brand-300 font-mono bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700">123456</strong>
                      </span>
                    ) : (
                      <span className="text-stone-400 dark:text-slate-500">
                        Check your email for the 6-digit code
                      </span>
                    )}
                    <Link href="/resend-verification" className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">
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
                  <Link href="/login" className="text-xs text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-white transition-colors">
                    ← Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
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
