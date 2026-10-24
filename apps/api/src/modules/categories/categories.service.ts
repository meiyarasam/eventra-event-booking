import { prisma, isDatabaseConnected } from '../../config/database';
import { EventStatus } from '@eventra/shared';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';

export class CategoriesService {
  async getAllCategories() {
    if (!isDatabaseConnected) {
      return devFallbackStore.categories.map((cat) => {
        const count = devFallbackStore.events.filter(
          (e) => e.categoryId === cat.id && e.status === EventStatus.PUBLISHED
        ).length;
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          _count: { events: count },
        };
      });
    }
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              events: {
                where: { status: EventStatus.PUBLISHED },
              },
            },
          },
        },
      });

      return categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        _count: cat._count,
      }));
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.categories.map((cat) => {
          const count = devFallbackStore.events.filter(
            (e) => e.categoryId === cat.id && e.status === EventStatus.PUBLISHED
          ).length;
          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            _count: { events: count },
          };
        });
      }
      throw error;
    }
  }

  async getCategoryBySlug(slug: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              events: {
                where: { status: EventStatus.PUBLISHED },
              },
            },
          },
        },
      });

      return category;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        const cat = devFallbackStore.categories.find((c) => c.slug === slug);
        if (!cat) return null;
        const count = devFallbackStore.events.filter(
          (e) => e.categoryId === cat.id && e.status === EventStatus.PUBLISHED
        ).length;
        return {
          ...cat,
          _count: { events: count },
        };
      }
      throw error;
    }
  }
}

export const categoriesService = new CategoriesService();
