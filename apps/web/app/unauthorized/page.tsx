'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-block mb-2">
          <BrandLogo size="md" />
        </div>

        <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-600 block">
            403 Forbidden Access
          </span>
          <h1 className="font-serif text-3xl font-bold text-navy-950">
            Elevated Privileges Required
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            You do not have the required role permissions (Organizer or Administrator) to access this administrative workspace or route.
          </p>
        </div>

        <Card className="border-stone-200 shadow-sm text-xs text-stone-500 p-4 space-y-2 text-left bg-stone-50">
          <p>
            • If you are an attendee planning to host an event, submit an{' '}
            <Link href="/profile/organizer-access" className="text-brand-600 font-semibold hover:underline">
              Organizer Access Request
            </Link>.
          </p>
          <p>
            • If you believe this is an error, try logging in with an authorized account or contact platform support.
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="primary" className="w-full sm:w-auto gap-2 font-semibold shadow-md bg-amber-600 hover:bg-amber-700 text-white border-0">
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Sign In as Admin</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
