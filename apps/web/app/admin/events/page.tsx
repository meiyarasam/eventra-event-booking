'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/store/toast-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  MapPin,
  Eye,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Globe,
  Tag,
  Ticket,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';

const PRESET_BANNERS = [
  {
    label: 'Technology Summit',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
  },
  {
    label: 'Music & Concert',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
  },
  {
    label: 'Business Executive',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
  },
  {
    label: 'Design & Culture',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
  },
  {
    label: 'Masterclass Workshop',
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80',
  },
];

interface TicketTypeItem {
  id?: string;
  name: string;
  price: number;
  totalQuantity: number;
}

export default function AdminEventsManagementPage() {
  const queryClient = useQueryClient();

  // Active view tab: 'all' = Event Management, 'moderation' = Pending Approval Queue
  const [activeTab, setActiveTab] = useState<'all' | 'moderation'>('all');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<any | null>(null);
  const [rejectModalEvent, setRejectModalEvent] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsOnline, setFormIsOnline] = useState(false);
  const [formVenueName, setFormVenueName] = useState('');
  const [formVenueAddress, setFormVenueAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCapacity, setFormCapacity] = useState(250);
  const [formCancellationPolicy, setFormCancellationPolicy] = useState('Full refund up to 48 hours before start.');
  const [formStatus, setFormStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [formTicketTypes, setFormTicketTypes] = useState<TicketTypeItem[]>([
    { name: 'General Admission', price: 0, totalQuantity: 200 },
    { name: 'VIP Pass', price: 99, totalQuantity: 50 },
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleAiGenerateDescription = async () => {
    if (!formTitle.trim()) {
      toast.error('Please enter an Event Title before generating description.');
      return;
    }
    const matchedCategory = categories.find((c) => c.id === formCategoryId);

    setIsAiGenerating(true);
    try {
      const res = await api.post<{ success: boolean; data: { description: string } }>(
        '/ai/generate-description',
        {
          title: formTitle.trim(),
          categoryName: matchedCategory?.name,
          venueName: formVenueName,
          city: formCity,
          isOnline: formIsOnline,
        }
      );
      if (res.data?.description) {
        setFormDescription(res.data.description);
        toast.success('AI description generated successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate description with AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: any[] }>('/categories'),
  });
  const categories = categoriesData?.data || [];

  // Fetch All Events for Admin Management
  const {
    data: allEventsData,
    isLoading: isLoadingAll,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['admin-all-events', search, selectedCategory, selectedStatus, currentPage],
    queryFn: () =>
      api.get<{ data: any[]; meta: any }>('/admin/events', {
        search: search.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        page: currentPage,
        limit: 10,
      }),
  });

  const allEvents = allEventsData?.data || [];
  const meta = allEventsData?.meta || { total: 0, totalPages: 1, page: 1 };

  // Fetch Pending Events for Moderation Queue
  const {
    data: pendingEventsData,
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['admin-pending-events'],
    queryFn: () => api.get<{ data: any[] }>('/admin/events/pending'),
  });

  const pendingEvents = pendingEventsData?.data || [];

  // Quick Status Toggle Mutation (Publish / Unpublish / Cancel)
  const statusMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      api.patch(`/admin/events/${eventId}/status`, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Event status changed to ${variables.status}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetchAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update event status');
    },
  });

  // Delete Event Mutation
  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => api.delete(`/admin/events/${eventId}`),
    onSuccess: (res: any) => {
      toast.success(res.message || 'Event permanently removed.');
      setDeletingEvent(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetchAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete event');
    },
  });

  // Create / Update Event Mutation
  const saveEventMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingEvent) {
        return api.patch(`/admin/events/${editingEvent.id}`, payload);
      }
      return api.post('/admin/events', payload);
    },
    onSuccess: () => {
      toast.success(editingEvent ? 'Event updated successfully!' : 'Event created and published!');
      setIsFormOpen(false);
      setEditingEvent(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetchAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save event');
    },
  });

  // Moderation Review Mutation (Approve / Reject)
  const reviewMutation = useMutation({
    mutationFn: (payload: { eventId: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      api.post(`/admin/events/${payload.eventId}/review`, {
        status: payload.status,
        rejectionReason: payload.rejectionReason,
      }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'APPROVED'
          ? 'Event proposal approved and added to catalog!'
          : 'Event proposal rejected.'
      );
      setRejectModalEvent(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
      refetchPending();
      refetchAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Review action failed');
    },
  });

  // Open Form for Adding New Event
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategoryId(categories[0]?.id || 'cat-1');
    setFormBannerUrl(PRESET_BANNERS[0].url);
    const tomorrow = new Date(Date.now() + 86400000);
    const dayAfter = new Date(Date.now() + 86400000 * 2);
    setFormStartDate(tomorrow.toISOString().slice(0, 16));
    setFormEndDate(dayAfter.toISOString().slice(0, 16));
    setFormIsOnline(false);
    setFormVenueName('Metropolitan Center Hall');
    setFormVenueAddress('450 Lexington Ave');
    setFormCity('New York');
    setFormCapacity(300);
    setFormCancellationPolicy('Full refund permitted up to 48 hours prior to start.');
    setFormStatus('PUBLISHED');
    setFormTicketTypes([
      { name: 'Standard Pass', price: 0, totalQuantity: 250 },
      { name: 'VIP Pass', price: 75, totalQuantity: 50 },
    ]);
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Event
  const handleOpenEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setFormTitle(ev.title || '');
    setFormDescription(ev.description || '');
    setFormCategoryId(ev.categoryId || categories[0]?.id || 'cat-1');
    setFormBannerUrl(ev.bannerUrl || PRESET_BANNERS[0].url);
    setFormStartDate(ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : '');
    setFormEndDate(ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '');
    setFormIsOnline(Boolean(ev.isOnline));
    setFormVenueName(ev.venueName || '');
    setFormVenueAddress(ev.venueAddress || '');
    setFormCity(ev.city || '');
    setFormCapacity(Number(ev.capacity || 100));
    setFormCancellationPolicy(ev.cancellationPolicy || 'Standard refund policy');
    setFormStatus(ev.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');
    setFormTicketTypes(
      ev.ticketTypes && ev.ticketTypes.length > 0
        ? ev.ticketTypes.map((t: any) => ({
            id: t.id,
            name: t.name,
            price: Number(t.price),
            totalQuantity: Number(t.totalQuantity),
          }))
        : [{ name: 'General Admission', price: 0, totalQuantity: Number(ev.capacity || 100) }]
    );
    setIsFormOpen(true);
  };

  // Ticket tier management helpers
  const handleAddTicketTier = () => {
    setFormTicketTypes((prev) => [
      ...prev,
      { name: `Tier ${prev.length + 1}`, price: 49, totalQuantity: 50 },
    ]);
  };

  const handleRemoveTicketTier = (index: number) => {
    if (formTicketTypes.length <= 1) {
      toast.error('An event must have at least one ticket tier.');
      return;
    }
    setFormTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTicketTier = (index: number, field: keyof TicketTypeItem, value: any) => {
    setFormTicketTypes((prev) =>
      prev.map((tt, i) => (i === index ? { ...tt, [field]: value } : tt))
    );
  };

  // Submit Handler
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Please enter an event title.');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Please enter an event description.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (new Date(formStartDate) >= new Date(formEndDate)) {
      toast.error('End date must be after start date.');
      return;
    }
    if (!formIsOnline && (!formVenueName.trim() || !formCity.trim())) {
      toast.error('Please provide a venue name and city for in-person events.');
      return;
    }

    const totalTickets = formTicketTypes.reduce((acc, t) => acc + Number(t.totalQuantity || 0), 0);
    if (totalTickets > Number(formCapacity)) {
      toast.error(
        `Total ticket quantities (${totalTickets}) cannot exceed total event capacity (${formCapacity}).`
      );
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      categoryId: formCategoryId,
      bannerUrl: formBannerUrl.trim(),
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      timeZone: 'UTC',
      isOnline: formIsOnline,
      venueName: formIsOnline ? 'Online Event' : formVenueName.trim(),
      venueAddress: formIsOnline ? 'Web link provided after booking' : formVenueAddress.trim(),
      city: formIsOnline ? 'Virtual' : formCity.trim(),
      capacity: Number(formCapacity),
      cancellationPolicy: formCancellationPolicy.trim(),
      status: formStatus,
      ticketTypes: formTicketTypes.map((tt) => ({
        id: tt.id,
        name: tt.name.trim(),
        price: Number(tt.price || 0),
        totalQuantity: Number(tt.totalQuantity || 0),
        maxPerUser: 10,
      })),
    };

    saveEventMutation.mutate(payload);
  };

  // Helper status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Published</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>Draft</span>
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Check className="w-3.5 h-3.5 text-blue-600" />
            <span>Approved</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Overview</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-navy-950">
              Admin Event Management
            </h1>
            <Badge variant="brand" className="text-xs font-bold px-2.5 py-0.5">
              Full Control
            </Badge>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Create, edit, publish, unpublish, and permanently delete any event across EVENTRA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenAddEvent}
            variant="primary"
            size="md"
            className="gap-2 bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-white shadow-md font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Event</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (All Events vs Moderation Queue) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-px">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-2 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'all'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Platform Events</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700 font-semibold">
              {meta.total || allEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={`pb-3 px-2 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'moderation'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Moderation Queue</span>
            {pendingEvents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-bold">
                {pendingEvents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ALL PLATFORM EVENTS (FULL CRUD MANAGEMENT)        */}
      {/* ======================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by title, city, or venue..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-700 focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-700 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="DRAFT">Draft Only</option>
                <option value="PENDING_APPROVAL">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {(search || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 underline ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Events Table / Card View */}
          {isLoadingAll ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : allEvents.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-stone-400" />}
              title="No events match your criteria"
              description="Try adjusting your search filters or click 'Add New Event' to create one now."
              actionText="Create First Event"
              onAction={handleOpenAddEvent}
            />
          ) : (
            <div className="space-y-4">
              {allEvents.map((ev) => {
                const isPublished = ev.status === 'PUBLISHED';
                const prices = (ev.ticketTypes || []).map((t: any) => Number(t.price));
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                const bookingsCount = ev._count?.bookings || 0;

                return (
                  <Card
                    key={ev.id}
                    className="border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        {/* Event Thumbnail & Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-20 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ev.bannerUrl || PRESET_BANNERS[0].url}
                              alt={ev.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {renderStatusBadge(ev.status)}
                              {ev.category && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700">
                                  {ev.category.name}
                                </span>
                              )}
                              {ev.isOnline ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                  <Globe className="w-3 h-3" />
                                  <span>Virtual Online</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 bg-stone-50 px-2 py-0.5 rounded-full">
                                  <MapPin className="w-3 h-3 text-stone-400" />
                                  <span>{ev.city || 'In-Person'}</span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-navy-950 truncate hover:text-brand-600 transition-colors">
                              <Link href={`/events/${ev.slug}`} target="_blank" className="hover:underline">
                                {ev.title}
                              </Link>
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                <span>{formatDate(ev.startDate)}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Ticket className="w-3.5 h-3.5 text-stone-400" />
                                <span>
                                  {minPrice === 0 && maxPrice === 0
                                    ? 'Free Event'
                                    : minPrice === maxPrice
                                    ? formatCurrency(minPrice)
                                    : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                                </span>
                              </span>
                              <span className="text-stone-400">•</span>
                              <span>Capacity: {ev.capacity}</span>
                              <span className="text-stone-400">•</span>
                              <span className="font-semibold text-stone-700">
                                {bookingsCount} {bookingsCount === 1 ? 'Booking' : 'Bookings'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                          {/* Quick Publish / Unpublish Toggle */}
                          {isPublished ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => statusMutation.mutate({ eventId: ev.id, status: 'DRAFT' })}
                              isLoading={statusMutation.isPending}
                              className="text-xs font-semibold text-stone-700 hover:bg-stone-100 border-stone-300"
                              title="Unpublish this event (hides from public catalog)"
                            >
                              Unpublish
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => statusMutation.mutate({ eventId: ev.id, status: 'PUBLISHED' })}
                              isLoading={statusMutation.isPending}
                              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              title="Publish this event to the public catalog"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </Button>
                          )}

                          {/* Edit Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditEvent(ev)}
                            className="text-xs font-semibold text-stone-700 hover:text-stone-900 border-stone-300 gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Button>

                          {/* Delete Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingEvent(ev)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2"
                            title="Permanently delete event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                          {/* View Live Link */}
                          <Link
                            href={`/events/${ev.slug}`}
                            target="_blank"
                            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Open public event page in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-stone-200 text-xs text-stone-500">
                  <span>
                    Showing Page {meta.page} of {meta.totalPages} ({meta.total} Total Events)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="gap-1 px-3"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= meta.totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="gap-1 px-3"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MODERATION QUEUE (ORGANIZER PROPOSALS REVIEW)      */}
      {/* ======================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                These events were submitted by community organizers and are waiting for your administrative decision.
              </span>
            </div>
            <span className="font-bold">{pendingEvents.length} Pending Approval</span>
          </div>

          {isLoadingPending ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-stone-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : pendingEvents.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-12 h-12 text-emerald-500" />}
              title="Moderation Queue Clear"
              description="There are currently no events waiting for review. All organizer submissions have been processed."
            />
          ) : (
            <div className="space-y-6">
              {pendingEvents.map((event) => (
                <Card key={event.id} className="border-stone-200 shadow-sm overflow-hidden bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.bannerUrl || PRESET_BANNERS[0].url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="warning" className="text-xs font-bold">
                            PENDING REVIEW
                          </Badge>
                          {event.category && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                              {event.category.name}
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-xl font-bold text-navy-950">
                          {event.title}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                          <span className="flex items-center gap-1 font-medium text-stone-700">
                            <User className="w-3.5 h-3.5 text-stone-400" />
                            {event.organizer?.name || 'Organizer'} (
                            {event.organizer?.profile?.organizationName || 'Independent'})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {formatDate(event.startDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            {event.isOnline ? 'Online' : event.city || event.venueName || 'In-Person'}
                          </span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-stone-100">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => reviewMutation.mutate({ eventId: event.id, status: 'APPROVED' })}
                          isLoading={reviewMutation.isPending}
                          className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve & Add</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRejectModalEvent(event);
                            setRejectionReason('');
                          }}
                          className="w-full gap-1.5 text-rose-600 hover:bg-rose-50 border-rose-200 font-semibold"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT EVENT FORM MODAL                     */}
      {/* ======================================================== */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEvent ? 'Edit Platform Event' : 'Add New Event (Admin Console)'}
        description={
          editingEvent
            ? 'Update event metadata, schedule, ticket tiers, or visibility.'
            : 'Create and publish an official event to the EVENTRA public catalog.'
        }
        className="max-w-3xl"
      >
        <form onSubmit={handleSaveEvent} className="space-y-6 pt-2">
          {/* 1. Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>General Information</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Event Title *
              </label>
              <Input
                placeholder="e.g. Global Tech & AI Summit 2027"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-200">
                  Description *
                </label>
                <button
                  type="button"
                  onClick={handleAiGenerateDescription}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg border border-brand-500/30 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-brand-400 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'Generating...' : '✨ Generate with AI'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Comprehensive summary of the event program, keynote speakers, and attendees..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
                className="w-full p-3.5 text-sm bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 border border-stone-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Category *
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Publication Status *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold text-stone-800"
                >
                  <option value="PUBLISHED">Published (Visible immediately on Home & Explore)</option>
                  <option value="DRAFT">Draft (Hidden from public catalog)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Banner & Visuals */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-brand-600" />
              <span>Event Banner Image</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Banner Image URL
              </label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={formBannerUrl}
                onChange={(e) => setFormBannerUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-stone-500">Or choose a curated high-resolution preset:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_BANNERS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormBannerUrl(preset.url)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      formBannerUrl === preset.url
                        ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {formBannerUrl && (
              <div className="w-full h-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 relative mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formBannerUrl} alt="Preview" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white">
                  Live Banner Preview
                </span>
              </div>
            )}
          </div>

          {/* 3. Schedule & Location */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Dates & Location</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <input
                type="checkbox"
                id="isOnlineCheck"
                checked={formIsOnline}
                onChange={(e) => setFormIsOnline(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-stone-300 focus:ring-brand-500"
              />
              <label htmlFor="isOnlineCheck" className="text-xs font-semibold text-stone-800 cursor-pointer">
                This is a Virtual / Online Event (No physical venue required)
              </label>
            </div>

            {!formIsOnline && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    City *
                  </label>
                  <Input
                    placeholder="e.g. San Francisco"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required={!formIsOnline}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Venue Name *
                  </label>
                  <Input
                    placeholder="e.g. Moscone Center"
                    value={formVenueName}
                    onChange={(e) => setFormVenueName(e.target.value)}
                    required={!formIsOnline}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Street Address
                  </label>
                  <Input
                    placeholder="e.g. 747 Howard St"
                    value={formVenueAddress}
                    onChange={(e) => setFormVenueAddress(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Total Event Capacity *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Cancellation Policy
                </label>
                <Input
                  value={formCancellationPolicy}
                  onChange={(e) => setFormCancellationPolicy(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Ticket Types Builder */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-brand-600" />
                <span>Ticket Tiers & Pricing</span>
              </h4>
              <button
                type="button"
                onClick={handleAddTicketTier}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 underline"
              >
                + Add Another Tier
              </button>
            </div>

            <div className="space-y-2.5">
              {formTicketTypes.map((tier, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Tier Name
                    </label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleUpdateTicketTier(idx, 'name', e.target.value)}
                      placeholder="e.g. General Admission"
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={tier.price}
                      onChange={(e) => handleUpdateTicketTier(idx, 'price', Number(e.target.value))}
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={tier.totalQuantity}
                      onChange={(e) => handleUpdateTicketTier(idx, 'totalQuantity', Number(e.target.value))}
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => handleRemoveTicketTier(idx)}
                      disabled={formTicketTypes.length <= 1}
                      className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
                      title="Remove tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={saveEventMutation.isPending}
              className="gap-2 bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-white font-bold px-6"
            >
              <Check className="w-4 h-4" />
              <span>{editingEvent ? 'Save Changes' : 'Create & Publish Event'}</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL                       */}
      {/* ======================================================== */}
      <Dialog
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        title="Permanently Delete Event"
        description="This action is irreversible and permanently purges the event from the system."
      >
        {deletingEvent && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-rose-950 mb-1">
                    Delete &ldquo;{deletingEvent.title}&rdquo;?
                  </p>
                  <p>
                    Are you sure you want to permanently delete this event? All public links, QR pass references, and ticket listings will be immediately removed.
                  </p>
                </div>
              </div>

              {deletingEvent._count?.bookings > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-rose-200/60 border border-rose-300 text-rose-950 font-semibold">
                  ⚠️ Critical Warning: This event has{' '}
                  <span className="font-extrabold">{deletingEvent._count.bookings} confirmed bookings</span>.
                  Deleting it will disrupt attendees who hold passes for this event.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeletingEvent(null)}
              >
                Keep Event
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingEvent.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Permanent Deletion</span>
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 3: REJECT MODERATION PROPOSAL MODAL                */}
      {/* ======================================================== */}
      <Dialog
        isOpen={!!rejectModalEvent}
        onClose={() => setRejectModalEvent(null)}
        title="Reject Event Proposal"
        description="Provide feedback to the organizer explaining why this event proposal was not approved."
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-200 mb-1">
              Rejection Reason & Guidelines Feedback
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please provide a verified physical venue address and specify speaker credentials..."
              className="w-full p-3.5 text-sm border border-stone-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 rounded-xl focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="md" onClick={() => setRejectModalEvent(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={reviewMutation.isPending}
              onClick={() =>
                reviewMutation.mutate({
                  eventId: rejectModalEvent.id,
                  status: 'REJECTED',
                  rejectionReason,
                })
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
