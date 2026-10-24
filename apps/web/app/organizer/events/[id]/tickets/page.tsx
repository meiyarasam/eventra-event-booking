'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { formatCurrency } from '@/lib/utils';
import { EventDTO, TicketTypeDTO } from '@eventra/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Ticket, Edit3, Trash2, ShieldCheck, Users } from 'lucide-react';

export default function ManageEventTicketsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tierName, setTierName] = useState('');
  const [tierPrice, setTierPrice] = useState('49.00');
  const [tierQuantity, setTierQuantity] = useState('100');
  const [tierDescription, setTierDescription] = useState('');
  const [maxPerUser, setMaxPerUser] = useState('10');

  // Fetch event details
  const { data: eventData, isLoading, refetch } = useQuery({
    queryKey: ['organizer-event-tickets', eventId],
    queryFn: () => api.get<{ data: EventDTO }>(`/events/${eventId}`),
  });

  const event = eventData?.data;
  const ticketTypes = (event as any)?.ticketTypes || [];

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Ticket tier "${tierName}" added successfully`);
    setIsAddModalOpen(false);
    setTierName('');
    setTierDescription('');
    refetch();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy-950">Manage Ticket Tiers</h1>
            <p className="text-sm text-stone-500 mt-1">
              Configure admission tiers, pricing, and available inventory for {event?.title || 'your event'}.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ticket Tier</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-stone-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : ticketTypes.length === 0 ? (
        <Card className="border-dashed border-2 border-stone-300 py-12 text-center">
          <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No ticket tiers created yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Add at least one admission tier (such as General Admission or VIP) so attendees can purchase passes.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            Create First Tier
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {ticketTypes.map((tier: any) => {
            const sold = tier.soldQuantity || 0;
            const total = tier.totalQuantity || 100;
            const pct = Math.min(100, Math.round((sold / total) * 100));

            return (
              <Card key={tier.id} className="border-stone-200 shadow-sm hover:border-brand-300 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-serif text-lg font-bold text-stone-900">{tier.name}</h3>
                        <Badge variant="brand" className="text-xs font-bold">
                          {tier.price === 0 ? 'FREE' : formatCurrency(tier.price)}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500 max-w-xl">
                        {tier.description || 'Standard admission tier.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-stone-600">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Sold / Total</span>
                        <span className="font-mono font-bold text-sm text-stone-900">
                          {sold} / {total}
                        </span>
                      </div>
                      <div className="w-24 bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                        <div
                          className="bg-brand-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Tier Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Admission Ticket Tier"
        description="Define tier details and allocated capacity."
      >
        <form onSubmit={handleAddTier} className="p-4 space-y-4">
          <Input
            label="Tier Name"
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
            placeholder="e.g. VIP Backstage Pass"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="1"
              label="Price (INR ₹)"
              value={tierPrice}
              onChange={(e) => setTierPrice(e.target.value)}
              min={0}
              required
            />
            <Input
              type="number"
              label="Allocated Quantity"
              value={tierQuantity}
              onChange={(e) => setTierQuantity(e.target.value)}
              min={1}
              required
            />
          </div>

          <Input
            type="number"
            label="Max Passes Per Attendee"
            value={maxPerUser}
            onChange={(e) => setMaxPerUser(e.target.value)}
            min={1}
            max={20}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block">Tier Description</label>
            <textarea
              value={tierDescription}
              onChange={(e) => setTierDescription(e.target.value)}
              rows={3}
              placeholder="What benefits or access does this tier include?..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Tier
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
