'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput, UserRole } from '@eventra/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Suspense } from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);
      const res = await api.post<{ data: { user: any } }>('/auth/login', data);
      setUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);

      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-[#FAF9F6] to-slate-100">
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[300px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none -z-0 animate-float" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[280px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-0 animate-float-slow" />
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-2" />
          <h1 className="font-serif text-2xl font-bold text-navy-950">User Sign In</h1>
          <p className="text-xs text-stone-500">
            Attendee and Organizer portal for tickets, reservations, and events.
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-stone-200 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-brand-600 hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-base font-bold shadow-sm"
                >
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Register & Admin Footer Links */}
        <div className="text-center space-y-2 pt-1">
          <p className="text-xs text-stone-500">
            Don't have an account yet?{' '}
            <Link href="/register" className="font-semibold text-brand-600 hover:underline">
              Create an Attendee Account
            </Link>
          </p>
          <div className="pt-2 border-t border-stone-200">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Platform Administrator? Access Admin Portal →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-sm text-stone-400">Loading sign-in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
