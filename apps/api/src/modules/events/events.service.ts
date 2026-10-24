import { prisma, isDatabaseConnected } from '../../config/database';
import { AppError } from '../../utils/app-error';
import {
  EventInput,
  EventStatus,
  UserRole,
  EventDTO,
  TicketTypeDTO,
  ReservationStatus,
} from '@eventra/shared';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';
import { emailService } from '../../services/email.service';

export interface EventQueryOptions {
  search?: string;
  category?: string;
  city?: string;
  isOnline?: boolean;
  minPrice?: number;
  maxPrice?: number;
  freeOnly?: boolean;
  startDate?: string;
  endDate?: string;
  timeframe?: 'all' | 'today' | 'tomorrow' | 'this_weekend' | 'upcoming';
  sortBy?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
  status?: EventStatus;
}

export class EventsService {
  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomSuffix}`;
  }

  async getEvents(options: EventQueryOptions) {
    if (!isDatabaseConnected) {
      return this.getFallbackEvents(options);
    }
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(50, Math.max(1, options.limit || 12));
      const skip = (page - 1) * limit;

      const where: any = {
        status: options.status || EventStatus.PUBLISHED,
      };

      if (options.search) {
        where.OR = [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { city: { contains: options.search, mode: 'insensitive' } },
          { venueName: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      if (options.category) {
        where.category = {
          slug: options.category,
        };
      }

      if (options.city) {
        where.city = {
          contains: options.city,
          mode: 'insensitive',
        };
      }

      if (options.isOnline !== undefined) {
        where.isOnline = options.isOnline;
      }

      // Resolve timeframe presets if provided
      let effectiveStartDate = options.startDate ? new Date(options.startDate) : undefined;
      let effectiveEndDate = options.endDate ? new Date(options.endDate) : undefined;
      if (options.timeframe && options.timeframe !== 'all') {
        const now = new Date();
        if (options.timeframe === 'today') {
          effectiveStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          effectiveEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (options.timeframe === 'tomorrow') {
          const tm = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          effectiveStartDate = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), 0, 0, 0);
          effectiveEndDate = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), 23, 59, 59);
        } else if (options.timeframe === 'this_weekend') {
          const day = now.getDay();
          const toSaturday = (6 - day + 7) % 7;
          const sat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + toSaturday, 0, 0, 0);
          const sun = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 1, 23, 59, 59);
          effectiveStartDate = sat;
          effectiveEndDate = sun;
        } else if (options.timeframe === 'upcoming') {
          effectiveStartDate = now;
        }
      }

      if (effectiveStartDate) {
        where.startDate = { gte: effectiveStartDate };
      }
      if (effectiveEndDate) {
        where.endDate = { lte: effectiveEndDate };
      }

      let orderBy: any = { startDate: 'asc' };
      if (options.sortBy === 'date_desc') {
        orderBy = { startDate: 'desc' };
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: true,
            organizer: {
              select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } },
            },
            ticketTypes: {
              orderBy: { price: 'asc' },
            },
            _count: {
              select: { bookings: true },
            },
          },
        }),
        prisma.event.count({ where }),
      ]);

      // Active reservation clean up happens on the fly
      const now = new Date();

      const formattedEvents = await Promise.all(
        events.map(async (ev) => {
          // Calculate remaining tickets taking active reservations into account
          const ticketTypesWithAvailability: TicketTypeDTO[] = await Promise.all(
            ev.ticketTypes.map(async (tt) => {
              const activeReservationsCount = await prisma.reservationItem.aggregate({
                where: {
                  ticketTypeId: tt.id,
                  reservation: {
                    status: ReservationStatus.ACTIVE,
                    expiresAt: { gt: now },
                  },
                },
                _sum: { quantity: true },
              });

              const reservedQty = activeReservationsCount._sum.quantity || 0;
              const availableQuantity = Math.max(0, tt.totalQuantity - tt.soldQuantity - reservedQty);

              return {
                id: tt.id,
                eventId: tt.eventId,
                name: tt.name,
                description: tt.description,
                price: Number(tt.price),
                totalQuantity: tt.totalQuantity,
                soldQuantity: tt.soldQuantity,
                availableQuantity,
                maxPerUser: tt.maxPerUser,
                saleStartDate: tt.saleStartDate?.toISOString() || null,
                saleEndDate: tt.saleEndDate?.toISOString() || null,
              };
            })
          );

          return {
            id: ev.id,
            organizerId: ev.organizerId,
            categoryId: ev.categoryId,
            title: ev.title,
            slug: ev.slug,
            description: ev.description,
            bannerUrl: ev.bannerUrl,
            startDate: ev.startDate.toISOString(),
            endDate: ev.endDate.toISOString(),
            timeZone: ev.timeZone,
            isOnline: ev.isOnline,
            venueName: ev.venueName,
            venueAddress: ev.venueAddress,
            city: ev.city,
            capacity: ev.capacity,
            cancellationPolicy: ev.cancellationPolicy,
            status: ev.status,
            rejectionReason: ev.rejectionReason,
            createdAt: ev.createdAt.toISOString(),
            updatedAt: ev.updatedAt.toISOString(),
            organizer: {
              id: ev.organizer.id,
              name: ev.organizer.name,
              email: ev.organizer.email,
              avatarUrl: ev.organizer.profile?.avatarUrl || null,
            },
            category: ev.category,
            ticketTypes: ticketTypesWithAvailability,
            _count: ev._count,
          } as EventDTO;
        })
      );

      // Apply price filter in-memory if requested
      let finalEvents = formattedEvents;
      if (options.freeOnly) {
        finalEvents = finalEvents.filter((e) => e.ticketTypes?.some((t) => t.price === 0));
      } else {
        if (options.minPrice !== undefined) {
          finalEvents = finalEvents.filter((e) => e.ticketTypes?.some((t) => t.price >= options.minPrice!));
        }
        if (options.maxPrice !== undefined) {
          finalEvents = finalEvents.filter((e) => e.ticketTypes?.some((t) => t.price <= options.maxPrice!));
        }
      }

      if (options.sortBy === 'price_asc') {
        finalEvents.sort((a, b) => {
          const minA = Math.min(...(a.ticketTypes?.map((t) => t.price) || [0]));
          const minB = Math.min(...(b.ticketTypes?.map((t) => t.price) || [0]));
          return minA - minB;
        });
      } else if (options.sortBy === 'price_desc') {
        finalEvents.sort((a, b) => {
          const maxA = Math.max(...(a.ticketTypes?.map((t) => t.price) || [0]));
          const maxB = Math.max(...(b.ticketTypes?.map((t) => t.price) || [0]));
          return maxB - maxA;
        });
      }

      return {
        events: finalEvents,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return this.getFallbackEvents(options);
      }
      throw error;
    }
  }

  async getEventBySlugOrId(idOrSlug: string, currentUserId?: string) {
    if (!isDatabaseConnected) {
      return this.getFallbackEventByIdOrSlug(idOrSlug, currentUserId);
    }
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      const event = await prisma.event.findFirst({
        where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
        include: {
          category: true,
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: {
                select: {
                  avatarUrl: true,
                  bio: true,
                  organizationName: true,
                  websiteUrl: true,
                },
              },
            },
          },
          ticketTypes: {
            orderBy: { price: 'asc' },
          },
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!event) {
        throw AppError.notFound('Event not found');
      }

      // Check if saved by current user
      let isSaved = false;
      if (currentUserId) {
        const saved = await prisma.savedEvent.findUnique({
          where: {
            userId_eventId: {
              userId: currentUserId,
              eventId: event.id,
            },
          },
        });
        isSaved = !!saved;
      }

      const now = new Date();
      const ticketTypesWithAvailability: TicketTypeDTO[] = await Promise.all(
        event.ticketTypes.map(async (tt) => {
          const activeReservationsCount = await prisma.reservationItem.aggregate({
            where: {
              ticketTypeId: tt.id,
              reservation: {
                status: ReservationStatus.ACTIVE,
                expiresAt: { gt: now },
              },
            },
            _sum: { quantity: true },
          });

          const reservedQty = activeReservationsCount._sum.quantity || 0;
          const availableQuantity = Math.max(0, tt.totalQuantity - tt.soldQuantity - reservedQty);

          return {
            id: tt.id,
            eventId: tt.eventId,
            name: tt.name,
            description: tt.description,
            price: Number(tt.price),
            totalQuantity: tt.totalQuantity,
            soldQuantity: tt.soldQuantity,
            availableQuantity,
            maxPerUser: Math.max(tt.maxPerUser || 10, 10),
            saleStartDate: tt.saleStartDate?.toISOString() || null,
            saleEndDate: tt.saleEndDate?.toISOString() || null,
          };
        })
      );

      return {
        id: event.id,
        organizerId: event.organizerId,
        categoryId: event.categoryId,
        title: event.title,
        slug: event.slug,
        description: event.description,
        bannerUrl: event.bannerUrl,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        timeZone: event.timeZone,
        isOnline: event.isOnline,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        city: event.city,
        capacity: event.capacity,
        cancellationPolicy: event.cancellationPolicy,
        status: event.status,
        rejectionReason: event.rejectionReason,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        isSaved,
        organizer: {
          id: event.organizer.id,
          name: event.organizer.name,
          email: event.organizer.email,
          avatarUrl: event.organizer.profile?.avatarUrl || null,
          bio: event.organizer.profile?.bio || null,
          organizationName: event.organizer.profile?.organizationName || null,
          websiteUrl: event.organizer.profile?.websiteUrl || null,
        },
        category: event.category,
        ticketTypes: ticketTypesWithAvailability,
        _count: event._count,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return this.getFallbackEventByIdOrSlug(idOrSlug, currentUserId);
      }
      throw error;
    }
  }

  private getFallbackEvents(options: EventQueryOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 12));
    const targetStatus = options.status || EventStatus.PUBLISHED;

    let filtered = devFallbackStore.events.filter((e) => e.status === targetStatus);

    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.venueName?.toLowerCase().includes(q)
      );
    }

    if (options.category) {
      filtered = filtered.filter((e) => e.category?.slug === options.category);
    }

    if (options.city) {
      filtered = filtered.filter((e) => e.city?.toLowerCase().includes(options.city!.toLowerCase()));
    }

    if (options.isOnline !== undefined) {
      filtered = filtered.filter((e) => e.isOnline === options.isOnline);
    }

    if (options.freeOnly) {
      filtered = filtered.filter((e) => e.ticketTypes?.some((t) => t.price === 0));
    } else {
      if (options.minPrice !== undefined) {
        filtered = filtered.filter((e) => e.ticketTypes?.some((t) => t.price >= options.minPrice!));
      }
      if (options.maxPrice !== undefined) {
        filtered = filtered.filter((e) => e.ticketTypes?.some((t) => t.price <= options.maxPrice!));
      }
    }

    // Resolve timeframe presets
    let effectiveStartDate = options.startDate ? new Date(options.startDate) : undefined;
    let effectiveEndDate = options.endDate ? new Date(options.endDate) : undefined;
    if (options.timeframe && options.timeframe !== 'all') {
      const now = new Date();
      if (options.timeframe === 'today') {
        effectiveStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        effectiveEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (options.timeframe === 'tomorrow') {
        const tm = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        effectiveStartDate = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), 0, 0, 0);
        effectiveEndDate = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), 23, 59, 59);
      } else if (options.timeframe === 'this_weekend') {
        const day = now.getDay();
        const toSaturday = (6 - day + 7) % 7;
        const sat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + toSaturday, 0, 0, 0);
        const sun = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 1, 23, 59, 59);
        effectiveStartDate = sat;
        effectiveEndDate = sun;
      } else if (options.timeframe === 'upcoming') {
        effectiveStartDate = now;
      }
    }

    if (effectiveStartDate) {
      filtered = filtered.filter((e) => new Date(e.startDate).getTime() >= effectiveStartDate!.getTime());
    }
    if (effectiveEndDate) {
      filtered = filtered.filter((e) => new Date(e.endDate).getTime() <= effectiveEndDate!.getTime());
    }

    if (options.sortBy === 'price_asc') {
      filtered.sort(
        (a, b) =>
          Math.min(...a.ticketTypes.map((t) => t.price)) - Math.min(...b.ticketTypes.map((t) => t.price))
      );
    } else if (options.sortBy === 'price_desc') {
      filtered.sort(
        (a, b) =>
          Math.max(...b.ticketTypes.map((t) => t.price)) - Math.max(...a.ticketTypes.map((t) => t.price))
      );
    } else if (options.sortBy === 'date_desc') {
      filtered.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    } else {
      filtered.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const formattedEvents: EventDTO[] = paginated.map((ev) => ({
      id: ev.id,
      organizerId: ev.organizerId,
      categoryId: ev.categoryId,
      title: ev.title,
      slug: ev.slug,
      description: ev.description,
      bannerUrl: ev.bannerUrl,
      startDate: ev.startDate.toISOString(),
      endDate: ev.endDate.toISOString(),
      timeZone: ev.timeZone,
      isOnline: ev.isOnline,
      venueName: ev.venueName,
      venueAddress: ev.venueAddress,
      city: ev.city,
      capacity: ev.capacity,
      cancellationPolicy: ev.cancellationPolicy,
      status: ev.status,
      rejectionReason: ev.rejectionReason,
      createdAt: ev.createdAt.toISOString(),
      updatedAt: ev.updatedAt.toISOString(),
      organizer: {
        id: ev.organizer.id,
        name: ev.organizer.name,
        email: ev.organizer.email,
        avatarUrl: ev.organizer.profile?.avatarUrl || null,
      },
      category: ev.category as any,
      ticketTypes: ev.ticketTypes.map((tt) => ({
        id: tt.id,
        eventId: tt.eventId,
        name: tt.name,
        price: tt.price,
        totalQuantity: tt.totalQuantity,
        soldQuantity: tt.soldQuantity,
        availableQuantity: Math.max(0, tt.totalQuantity - tt.soldQuantity),
        maxPerUser: Math.max(tt.maxPerUser || 10, 10),
        saleStartDate: null,
        saleEndDate: null,
      })),
      _count: ev._count || { bookings: 5 },
    }));

    return {
      events: formattedEvents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private getFallbackEventByIdOrSlug(idOrSlug: string, _currentUserId?: string) {
    const ev = devFallbackStore.events.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
    if (!ev) {
      throw AppError.notFound('Event not found');
    }

    return {
      id: ev.id,
      organizerId: ev.organizerId,
      categoryId: ev.categoryId,
      title: ev.title,
      slug: ev.slug,
      description: ev.description,
      bannerUrl: ev.bannerUrl,
      startDate: ev.startDate.toISOString(),
      endDate: ev.endDate.toISOString(),
      timeZone: ev.timeZone,
      isOnline: ev.isOnline,
      venueName: ev.venueName,
      venueAddress: ev.venueAddress,
      city: ev.city,
      capacity: ev.capacity,
      cancellationPolicy: ev.cancellationPolicy,
      status: ev.status,
      rejectionReason: ev.rejectionReason,
      createdAt: ev.createdAt.toISOString(),
      updatedAt: ev.updatedAt.toISOString(),
      isSaved: false,
      organizer: {
        id: ev.organizer.id,
        name: ev.organizer.name,
        email: ev.organizer.email,
        avatarUrl: ev.organizer.profile?.avatarUrl || null,
        bio: ev.organizer.profile?.bio || null,
        organizationName: ev.organizer.profile?.organizationName || null,
        websiteUrl: ev.organizer.profile?.websiteUrl || null,
      },
      category: ev.category,
      ticketTypes: ev.ticketTypes.map((tt) => ({
        id: tt.id,
        eventId: tt.eventId,
        name: tt.name,
        price: tt.price,
        totalQuantity: tt.totalQuantity,
        soldQuantity: tt.soldQuantity,
        availableQuantity: Math.max(0, tt.totalQuantity - tt.soldQuantity),
        maxPerUser: Math.max(tt.maxPerUser || 10, 10),
        saleStartDate: null,
        saleEndDate: null,
      })),
      _count: ev._count || { bookings: 5 },
    };
  }

  async createEvent(userId: string, input: EventInput) {
    if (!isDatabaseConnected) {
      return devFallbackStore.createEvent(userId, input);
    }
    const slug = this.generateSlug(input.title);

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw AppError.badRequest('Invalid category selected');
    }

    // Verify total ticket types capacity does not exceed event capacity
    const totalTicketCount = input.ticketTypes.reduce((acc, t) => acc + t.totalQuantity, 0);
    if (totalTicketCount > input.capacity) {
      throw AppError.badRequest(
        `Total ticket quantities (${totalTicketCount}) cannot exceed total event capacity (${input.capacity}).`
      );
    }

    const event = await prisma.event.create({
      data: {
        organizerId: userId,
        categoryId: input.categoryId,
        title: input.title,
        slug,
        description: input.description,
        bannerUrl: input.bannerUrl,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        timeZone: input.timeZone || 'UTC',
        isOnline: input.isOnline,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        city: input.city,
        capacity: input.capacity,
        cancellationPolicy: input.cancellationPolicy,
        status: EventStatus.DRAFT,
        ticketTypes: {
          create: input.ticketTypes.map((tt) => ({
            name: tt.name,
            description: tt.description,
            price: tt.price,
            totalQuantity: tt.totalQuantity,
            maxPerUser: tt.maxPerUser || 5,
            saleStartDate: tt.saleStartDate ? new Date(tt.saleStartDate) : null,
            saleEndDate: tt.saleEndDate ? new Date(tt.saleEndDate) : null,
          })),
        },
      },
      include: {
        category: true,
        ticketTypes: true,
      },
    });

    return event;
  }

  async updateEvent(eventId: string, userId: string, userRole: UserRole, input: Partial<EventInput>) {
    if (!isDatabaseConnected) {
      return devFallbackStore.updateEvent(eventId, userId, userRole, input);
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!event) {
      throw AppError.notFound('Event not found');
    }

    if (event.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You are not authorized to update this event');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw AppError.badRequest('Cancelled events cannot be modified');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update core event fields
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          ...(input.title ? { title: input.title } : {}),
          ...(input.description ? { description: input.description } : {}),
          ...(input.categoryId ? { categoryId: input.categoryId } : {}),
          ...(input.bannerUrl ? { bannerUrl: input.bannerUrl } : {}),
          ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
          ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
          ...(input.timeZone ? { timeZone: input.timeZone } : {}),
          ...(input.isOnline !== undefined ? { isOnline: input.isOnline } : {}),
          ...(input.venueName !== undefined ? { venueName: input.venueName } : {}),
          ...(input.venueAddress !== undefined ? { venueAddress: input.venueAddress } : {}),
          ...(input.city !== undefined ? { city: input.city } : {}),
          ...(input.capacity ? { capacity: input.capacity } : {}),
          ...(input.cancellationPolicy ? { cancellationPolicy: input.cancellationPolicy } : {}),
        },
        include: {
          category: true,
          ticketTypes: true,
        },
      });

      return updatedEvent;
    });

    return updated;
  }

  async submitForApproval(eventId: string, userId: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.submitForApproval(eventId, userId);
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!event) {
      throw AppError.notFound('Event not found');
    }

    if (event.organizerId !== userId) {
      throw AppError.forbidden('You are not authorized to submit this event');
    }

    if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.REJECTED) {
      throw AppError.badRequest(`Event in status '${event.status}' cannot be submitted for approval.`);
    }

    if (!event.ticketTypes || event.ticketTypes.length === 0) {
      throw AppError.badRequest('Event must have at least one ticket type before submission.');
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.PENDING_APPROVAL,
        rejectionReason: null,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Event Submitted for Approval',
          message: `"${event.title}" is pending administrative review.`,
          type: 'EVENT_APPROVAL',
          link: `/admin/events`,
        },
      });
    }

    return updated;
  }

  async publishApprovedEvent(eventId: string, userId: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.publishEvent(eventId, userId, UserRole.ORGANIZER);
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw AppError.notFound('Event not found');
    }

    if (event.organizerId !== userId) {
      throw AppError.forbidden('You are not authorized to publish this event');
    }

    if (event.status !== EventStatus.APPROVED) {
      throw AppError.badRequest('Only approved events can be published to the public catalog.');
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.PUBLISHED },
    });

    return updated;
  }

  async getCities(): Promise<string[]> {
    if (!isDatabaseConnected) {
      await devFallbackStore.init();
      const cities = Array.from(new Set(devFallbackStore.events.map((e) => e.city).filter(Boolean))) as string[];
      return cities.sort();
    }
    try {
      const results = await prisma.event.findMany({
        where: { status: EventStatus.PUBLISHED, city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      });
      const cities = results.map((r) => r.city).filter(Boolean) as string[];
      if (cities.length === 0) {
        return ['New York', 'San Francisco', 'Chicago', 'London', 'Berlin'];
      }
      return cities.sort();
    } catch {
      await devFallbackStore.init();
      const cities = Array.from(new Set(devFallbackStore.events.map((e) => e.city).filter(Boolean))) as string[];
      return cities.sort();
    }
  }

  async cancelEvent(eventId: string, userId: string, userRole: UserRole, reason?: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.cancelEvent(eventId, userId, userRole, reason);
    }
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          bookings: {
            where: { status: 'CONFIRMED' },
            include: { user: true },
          },
        },
      });

      if (!event) {
        throw AppError.notFound('Event not found');
      }

      if (event.organizerId !== userId && userRole !== UserRole.ADMIN) {
        throw AppError.forbidden('You are not authorized to cancel this event');
      }

      if (event.status === EventStatus.CANCELLED) {
        throw AppError.badRequest('Event is already cancelled');
      }

      const updated = await prisma.$transaction(async (tx) => {
        const cancelledEvent = await tx.event.update({
          where: { id: eventId },
          data: {
            status: EventStatus.CANCELLED,
            rejectionReason: reason || 'Event cancelled by organizer.',
          },
        });

        // Cancel all confirmed bookings and tickets
        for (const booking of event.bookings) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: reason || 'Event was cancelled by organizer.',
            },
          });

          await tx.ticket.updateMany({
            where: { bookingId: booking.id },
            data: { status: 'CANCELLED' },
          });

          // Create in-app notification for attendee
          await tx.notification.create({
            data: {
              userId: booking.userId,
              title: `Event Cancelled: ${event.title}`,
              message: `The event "${event.title}" has been cancelled. Your tickets have been voided and any simulated payments refunded.`,
              type: 'EVENT_CANCELLED',
              link: `/bookings/${booking.id}`,
            },
          });

          // Safely dispatch cancellation email
          const attendeeEmail = booking.user?.email || 'attendee@eventra.com';
          const attendeeName = booking.user?.name || 'Attendee';
          emailService.sendEventCancellationEmail(attendeeEmail, attendeeName, event.title, reason).catch((err) => {
            console.warn('⚠️ Non-fatal: Failed to send event cancellation email:', err.message);
          });
        }

        return cancelledEvent;
      });

      return updated;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.cancelEvent(eventId, userId, userRole, reason);
      }
      throw error;
    }
  }

  async toggleSaveEvent(userId: string, eventId: string) {
    const existing = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (existing) {
      await prisma.savedEvent.delete({
        where: { id: existing.id },
      });
      return { isSaved: false, message: 'Event removed from bookmarks' };
    } else {
      await prisma.savedEvent.create({
        data: { userId, eventId },
      });
      return { isSaved: true, message: 'Event saved to bookmarks' };
    }
  }

  async getSavedEvents(userId: string) {
    const saved = await prisma.savedEvent.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            category: true,
            ticketTypes: true,
            organizer: {
              select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => s.event);
  }

  async deleteEvent(eventId: string, userId: string, userRole: UserRole) {
    if (!isDatabaseConnected) {
      return devFallbackStore.adminDeleteEvent(eventId);
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw AppError.notFound('Event not found');
    if (event.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You are not authorized to delete this event');
    }
    await prisma.$transaction(async (tx) => {
      await tx.eventApproval.deleteMany({ where: { eventId } });
      await tx.savedEvent.deleteMany({ where: { eventId } });
      await tx.inventoryReservation.deleteMany({ where: { eventId } });
      await tx.ticketType.deleteMany({ where: { eventId } });
      await tx.event.delete({ where: { id: eventId } });
    });
    return { success: true, message: 'Event deleted successfully' };
  }
}

export const eventsService = new EventsService();
