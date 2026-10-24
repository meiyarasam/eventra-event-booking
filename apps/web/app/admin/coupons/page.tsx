'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Tag,
  Percent,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface PromoCoupon {
  id: string;
  code: string;
  discountPct: number;
  description: string;
  status: 'ACTIVE' | 'EXPIRED';
  usageCount: number;
  maxUses: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<PromoCoupon[]>([
    {
      id: 'cpn-1',
      code: 'EVENTRA20',
      discountPct: 20,
      description: 'Grand opening platform discount of 20% off all ticket tiers.',
      status: 'ACTIVE',
      usageCount: 42,
      maxUses: 500,
    },
    {
      id: 'cpn-2',
      code: 'WELCOME10',
      discountPct: 10,
      description: 'First-time attendee welcome promo code.',
      status: 'ACTIVE',
      usageCount: 118,
      maxUses: 1000,
    },
    {
      id: 'cpn-3',
      code: 'EARLYBIRD',
      discountPct: 15,
      description: 'Early bird registration incentive discount.',
      status: 'ACTIVE',
      usageCount: 85,
      maxUses: 200,
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountPct, setDiscountPct] = useState('20');
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState('100');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const newCoupon: PromoCoupon = {
      id: `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountPct: Number(discountPct),
      description: description.trim(),
      status: 'ACTIVE',
      usageCount: 0,
      maxUses: Number(maxUses),
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    toast.success(`Coupon "${newCoupon.code}" created successfully`);
    setIsAddModalOpen(false);
    setCode('');
    setDescription('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy-950">Promotions & Coupons</h1>
            <p className="text-sm text-stone-500 mt-1">
              Create promotional discount codes and manage coupon redemption across checkout flows.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon Code</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <Card key={c.id} className="border-stone-200 shadow-sm hover:border-brand-400 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-black text-brand-600 tracking-wider">
                  {c.code}
                </span>
                <Badge variant={c.status === 'ACTIVE' ? 'success' : 'outline'} className="text-[10px] uppercase font-bold">
                  {c.discountPct}% OFF
                </Badge>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">{c.description}</p>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Usage: <strong>{c.usageCount}</strong> / {c.maxUses}</span>
                <span className="text-emerald-700 font-semibold">Active</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Coupon Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Promotional Discount Code"
        description="Configure discount percentages and campaign redemption limits."
      >
        <form onSubmit={handleCreateCoupon} className="p-4 space-y-4">
          <Input
            label="Promo Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SUMMERSALE25"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Discount Percentage (%)"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              min={1}
              max={100}
              required
            />
            <Input
              type="number"
              label="Max Redemptions"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min={1}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block">Description / Campaign Note</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Internal campaign description or promo terms..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Coupon
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
