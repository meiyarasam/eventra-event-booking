'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EventDTO, CategoryDTO } from '@eventra/shared';
import { EventCard } from '@/components/events/event-card';
import { EventCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { toast } from '@/store/toast-store';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Bot,
  Flame,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Suspense } from 'react';

const TIMEFRAME_PRESETS = [
  { id: 'all', label: 'All Dates' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_weekend', label: 'This Weekend' },
  { id: 'upcoming', label: 'Upcoming' },
];

function EventsExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state initialization
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialCity = searchParams.get('city') || '';
  const initialTimeframe = searchParams.get('timeframe') || 'all';
  const initialSortBy = (searchParams.get('sortBy') as any) || 'date_asc';
  const initialFreeOnly = searchParams.get('freeOnly') === 'true';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  // Filter state
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [freeOnly, setFreeOnly] = useState(initialFreeOnly);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [page, setPage] = useState(initialPage);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // AI Search input & interpretation state
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Sync state with URL
  const updateUrlParams = (newParams: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === false || (k === 'timeframe' && v === 'all')) {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    router.push(`/events?${params.toString()}`);
  };

  // Categories list query
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: CategoryDTO[] }>('/categories'),
  });
  const categories = categoriesData?.data || [];

  // Verified Cities query
  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => api.get<{ data: string[] }>('/events/cities'),
  });
  const cities = citiesData?.data || [];

  // AI Personalized Recommendations query
  const { data: recommendationsData, isLoading: isLoadingRecs } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => api.get<{ data: EventDTO[] }>('/ai/recommendations'),
    staleTime: 5 * 60 * 1000,
  });
  const recommendations = recommendationsData?.data || [];

  // Events query
  const { data: eventsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', { search, category, city, timeframe, sortBy, freeOnly, minPrice, maxPrice, startDate, endDate, page }],
    queryFn: () =>
      api.get<{ data: EventDTO[]; meta: { page: number; total: number; totalPages: number } }>('/events', {
        search: search || undefined,
        category: category || undefined,
        city: city || undefined,
        timeframe: timeframe !== 'all' ? timeframe : undefined,
        sortBy,
        freeOnly: freeOnly ? true : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 9,
      }),
  });

  const events = eventsData?.data || [];
  const meta = eventsData?.meta || { page: 1, total: 0, totalPages: 1 };

  const handleApplyFilters = () => {
    setPage(1);
    updateUrlParams({
      search,
      category,
      city,
      timeframe,
      sortBy,
      freeOnly,
      minPrice,
      maxPrice,
      page: 1,
    });
    setFiltersOpen(false);
  };

  const handleSelectTimeframe = (tf: string) => {
    setTimeframe(tf);
    setPage(1);
    updateUrlParams({
      timeframe: tf !== 'all' ? tf : undefined,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setTimeframe('all');
    setSortBy('date_asc');
    setFreeOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setAiSummary(null);
    setAiQuery('');
    setPage(1);
    router.push('/events');
  };

  const handleAiSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = aiQuery.trim();
    if (!query) return;

    setIsAiSearching(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/ai/parse-search', { query });
      const parsed = res.data;
      if (parsed) {
        const nextSearch = parsed.search !== undefined ? parsed.search : '';
        const nextCategory = parsed.category || '';
        const nextCity = parsed.city || '';
        const nextTf = parsed.timeframe || 'all';
        const nextFree = Boolean(parsed.freeOnly);
        const nextMin = parsed.minPrice !== undefined && parsed.minPrice !== null ? String(parsed.minPrice) : '';
        const nextMax = parsed.maxPrice !== undefined && parsed.maxPrice !== null ? String(parsed.maxPrice) : '';

        setSearch(nextSearch);
        setCategory(nextCategory);
        setCity(nextCity);
        setTimeframe(nextTf);
        setFreeOnly(nextFree);
        setMinPrice(nextMin);
        setMaxPrice(nextMax);
        setAiSummary(parsed.interpretedSummary || `Matched: "${query}"`);
        setPage(1);

        updateUrlParams({
          search: nextSearch || undefined,
          category: nextCategory || undefined,
          city: nextCity || undefined,
          timeframe: nextTf !== 'all' ? nextTf : undefined,
          freeOnly: nextFree || undefined,
          minPrice: nextMin || undefined,
          maxPrice: nextMax || undefined,
          page: 1,
        });

        toast.success(parsed.interpretedSummary || 'Applied AI smart filters!');
      }
    } catch (err: any) {
      toast.error('AI search interpretation failed. Using standard search.');
      setSearch(query);
      updateUrlParams({ search: query, page: 1 });
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header with Vibrant Gradient Banner & Ambient Background Image */}
      <div className="relative mb-8 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ambient_mesh_bg.jpg"
            alt="Luminous background"
            className="w-full h-full object-cover opacity-20 mix-blend-screen filter brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-indigo-950/80 to-slate-900/90" />
        </div>

        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-brand-500/20 text-brand-300 border border-brand-500/30 inline-block shadow-sm">
            Verified Live Catalog
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Explore Events & Experiences
          </h1>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Search conferences, summits, acoustic concerts, and exhibitions. Filter by date, price, category, or location with our AI-powered discovery engine.
          </p>
        </div>
      </div>

      {/* Feature B: Natural-Language AI Search Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-950/40 via-purple-950/30 to-indigo-950/40 border border-brand-500/30 shadow-md">
        <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Bot className="w-5 h-5 text-brand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask AI in plain English (e.g. 'free tech conferences this weekend in New York' or 'music under 500')..."
              className="w-full pl-11 pr-4 py-3 bg-[#0B0F19]/90 text-sm text-slate-100 placeholder:text-slate-400 border border-brand-500/30 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <Button
            type="submit"
            disabled={isAiSearching || !aiQuery.trim()}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-brand-500 to-rose-600 hover:from-brand-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isAiSearching ? 'animate-spin' : ''}`} />
            <span>{isAiSearching ? 'Interpreting...' : 'Ask AI'}</span>
          </Button>
        </form>

        {aiSummary && (
          <div className="mt-3 flex items-center justify-between text-xs text-brand-300 bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>{aiSummary}</span>
            </span>
            <button
              onClick={() => {
                setAiSummary(null);
                setAiQuery('');
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Date Presets Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
        <span className="text-stone-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap mr-1 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" /> Date:
        </span>
        {TIMEFRAME_PRESETS.map((p) => {
          const isActive = timeframe === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectTimeframe(p.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-[#111827] text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Top Search & Filter Bar */}
      <div className="bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Keyword Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="Filter by title, keywords, or venue..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-slate-800/80 hover:bg-stone-100/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-sm text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 border border-stone-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  updateUrlParams({ search: undefined, page: 1 });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Category Select */}
          <div className="w-full md:w-56">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
                updateUrlParams({ category: e.target.value || undefined, page: 1 });
              }}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800/80 text-sm text-stone-900 dark:text-slate-100 border border-stone-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            >
              <option value="" className="bg-white dark:bg-slate-900">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="w-full md:w-48">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
                updateUrlParams({ sortBy: e.target.value, page: 1 });
              }}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800/80 text-sm text-stone-900 dark:text-slate-100 border border-stone-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            >
              <option value="date_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Date: Soonest First</option>
              <option value="date_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Date: Furthest First</option>
              <option value="price_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Price: Low to High</option>
              <option value="price_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Price: High to Low</option>
            </select>
          </div>

          {/* Advanced Filter Toggle */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full md:w-auto gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-stone-500 dark:text-slate-400" />
            <span>Filters</span>
            {(city || freeOnly || minPrice || maxPrice) && (
              <span className="w-2 h-2 rounded-full bg-brand-500" />
            )}
          </Button>

          <Button type="button" variant="primary" onClick={handleApplyFilters} className="w-full md:w-auto px-5">
            Search
          </Button>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {filtersOpen && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
            {/* Dynamic City Filter */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-slate-800/80 text-stone-900 dark:text-slate-100 border border-stone-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
                >
                  <option value="" className="bg-white dark:bg-slate-900">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Price Range (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800/80 text-stone-900 dark:text-slate-100 border border-stone-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
                />
                <span className="text-stone-400 dark:text-slate-600">-</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-slate-800/80 text-stone-900 dark:text-slate-100 border border-stone-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Free Events Checkbox & Reset */}
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeOnly}
                    onChange={(e) => setFreeOnly(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-stone-300 dark:border-slate-700 focus:ring-brand-500"
                  />
                  <span>Free Admission Only</span>
                </label>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white ml-auto transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature C: AI-Powered Recommendations Section (When Available) */}
      {recommendations.length > 0 && !search && category === '' && city === '' && timeframe === 'all' && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-500 dark:text-brand-400 flex items-center justify-center border border-brand-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-navy-950 dark:text-white tracking-tight">
                Recommended For You
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/20 dark:border-brand-500/30 font-medium">
                AI Match
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-slate-400">Based on your activity & trending events</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.slice(0, 3).map((rec) => (
              <EventCard key={`rec-${rec.id}`} event={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Events Results Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-950 dark:text-white tracking-tight">
          All Events
        </h2>
        {meta.total > 0 && (
          <span className="text-xs text-stone-500 dark:text-slate-400">
            {meta.total} {meta.total === 1 ? 'event' : 'events'} found
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : isError ? (
        <EmptyState
          title="Unable to Load Events"
          description="Could not connect to the API service. Please verify your connection or try again."
          actionText="Retry"
          onAction={() => refetch()}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="No Matching Events Found"
          description="We couldn't find any events matching your selected criteria. Try adjusting your search term, city, or category filters."
          actionText="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination Navigation */}
          {meta.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-stone-200 dark:border-slate-800 pt-6">
              <div className="text-sm text-stone-500 dark:text-slate-400">
                Showing page <span className="font-semibold text-stone-900 dark:text-white">{meta.page}</span> of{' '}
                <span className="font-semibold text-stone-900 dark:text-white">{meta.totalPages}</span> ({meta.total} total events)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    updateUrlParams({ page: newPage });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    updateUrlParams({ page: newPage });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function EventsExplorePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-sm text-stone-400">Loading events...</div>}>
      <EventsExploreContent />
    </Suspense>
  );
}
