'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/store/toast-store';
import { CategoryDTO } from '@eventra/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Layers,
  Sparkles,
  Edit,
  Trash2,
  FolderOpen,
  Calendar,
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');

  const { data: categoriesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get<{ data: CategoryDTO[] }>('/categories'),
  });

  const categories = categoriesData?.data || [];

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Category "${name}" created successfully`);
    setIsAddModalOpen(false);
    setName('');
    setSlug('');
    setDescription('');
    refetch();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Category Management</h1>
            <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
              Curate and configure discovery taxonomies across music, technology, conferences, and workshops.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-40 bg-stone-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="border-stone-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-brand-400 transition-all shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <Badge variant="brand" className="text-[10px] font-mono">
                    /{cat.slug}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">{cat.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {cat.description || 'Explore curated events under this topic.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                  <span className="font-semibold text-stone-700 dark:text-slate-200">
                    {cat._count?.events || 0} Listed Events
                  </span>
                  <Link
                    href={`/events?category=${cat.slug}`}
                    className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    View Public Feed →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Category Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Discovery Category"
        description="Create a new classification taxonomy for public event listings."
      >
        <form onSubmit={handleCreateCategory} className="p-4 space-y-4">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '')
              );
            }}
            placeholder="e.g. Comedy & Improv"
            required
          />

          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. comedy-improv"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description for attendees exploring this category..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Category
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
