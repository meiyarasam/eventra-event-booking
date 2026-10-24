'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordInput } from '@eventra/shared';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, ArrowLeft, Mail, Key } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true);
      const res = await api.post<{ message: string; devToken?: string }>('/auth/forgot-password', data);
      toast.success(res.message);
      if (res.devToken) {
        setDevToken(res.devToken);
      }
    } catch (err: any) {
      toast.error(err.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-2" />
          <h1 className="font-serif text-2xl font-bold text-navy-950">Reset Your Password</h1>
          <p className="text-xs text-stone-500">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        <Card className="border-stone-200 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full text-base font-bold shadow-sm"
              >
                Send Reset Link
              </Button>
            </form>

            {/* Development token viewer for technical evaluation */}
            {devToken && (
              <div className="mt-6 p-4 rounded-xl bg-brand-50 border border-brand-200 text-xs space-y-2">
                <div className="font-bold text-brand-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Evaluation Sandbox Reset Token:</span>
                </div>
                <p className="text-stone-600">
                  Because external SMTP is optional in development, here is your one-time reset token:
                </p>
                <div className="p-2 bg-white rounded-lg border border-brand-200 font-mono text-[10px] break-all">
                  {devToken}
                </div>
                <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`}>
                  <Button variant="secondary" size="sm" className="w-full mt-2 text-xs">
                    Proceed to Reset Form With Token →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-stone-500">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Return to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
