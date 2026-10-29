'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Mail, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const resendMutation = useMutation({
    mutationFn: (payload: { email: string }) =>
      api.post<{ success: boolean; message: string; devOtp?: string }>('/auth/resend-verification', payload),
    onSuccess: (res) => {
      setIsSent(true);
      if (res.devOtp) setDevCode(res.devOtp);
      toast.success(res.message || 'Verification email dispatched');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to dispatch verification email');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    resendMutation.mutate({ email: email.trim() });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-[#FAF9F6] to-slate-100 dark:from-[#0B0F19] dark:via-[#0E1528] dark:to-[#0B0F19] transition-colors">
      <div className="absolute inset-0 bg-dot-pattern opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[300px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none -z-0 animate-float" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[280px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-0 animate-float-slow" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-orange-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-950 dark:text-white">Resend Verification</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            Enter your registered email address to receive a fresh verification code.
          </p>
        </div>

        <Card className="border-stone-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-[#111827]">
          <CardContent className="pt-6">
            {isSent ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-stone-900 dark:text-white block">Verification Link Dispatched</span>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    We sent a link and 6-digit code to <strong>{email}</strong>.
                  </p>
                  {devCode && (
                    <div className="p-3 bg-stone-100 dark:bg-slate-800 rounded-xl mt-3 font-mono text-xs text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                      Dev Simulation OTP: <strong>{devCode}</strong>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <Link href={`/verify-email?email=${encodeURIComponent(email)}`}>
                    <Button variant="primary" className="w-full font-bold shadow-md">
                      Enter Verification Code
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

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={resendMutation.isPending}
                    className="w-full font-bold shadow-md gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Verification Code</span>
                  </Button>
                </div>

                <div className="pt-4 text-center">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
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
