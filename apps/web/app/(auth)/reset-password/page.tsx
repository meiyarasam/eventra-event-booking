'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, ResetPasswordInput } from '@eventra/shared';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';

import { Suspense } from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsLoading(true);
      const res = await api.post<{ message: string }>('/auth/reset-password', data);
      toast.success(res.message);
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-2" />
          <h1 className="font-serif text-2xl font-bold text-navy-950">Set New Password</h1>
          <p className="text-xs text-stone-500">
            Create a secure new password for your account.
          </p>
        </div>

        <Card className="border-stone-200 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Reset Security Token"
                placeholder="Paste token if not prefilled"
                error={errors.token?.message}
                {...register('token')}
              />

              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters (1 uppercase, 1 number)"
                hint="Must contain at least 8 characters, 1 uppercase, and 1 number."
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-stone-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-stone-500" />
                    )}
                  </button>
                }
                {...register('password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-base font-bold shadow-sm"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-sm text-stone-400">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
