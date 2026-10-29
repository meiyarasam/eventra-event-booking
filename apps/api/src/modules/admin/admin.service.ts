import { prisma, isDatabaseConnected } from '../../config/database';
import { AppError } from '../../utils/app-error';
import {
  EventStatus,
  OrganizerRequestStatus,
  UserRole,
  AccountStatus,
  BookingStatus,
} from '@eventra/shared';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';

export class AdminService {
  async getOverview() {
    if (!isDatabaseConnected) {
      return devFallbackStore.getAdminOverview();
    }
    try {
      const [
        totalUsers,
        totalEvents,
        pendingEventsCount,
        pendingOrganizersCount,
        confirmedBookingsCount,
        revenueResult,
        categoriesWithCounts,
        recentUsers,
        recentBookings,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.event.count({ where: { status: EventStatus.PENDING_APPROVAL } }),
        prisma.organizerRequest.count({ where: { status: OrganizerRequestStatus.PENDING } }),
        prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
        prisma.booking.aggregate({
          where: { status: BookingStatus.CONFIRMED },
          _sum: { totalAmount: true },
        }),
        prisma.category.findMany({
          select: {
            id: true,
            name: true,
            _count: { select: { events: true } },
          },
        }),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.booking.findMany({
          take: 5,
          where: { status: BookingStatus.CONFIRMED },
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            event: { select: { title: true } },
          },
        }),
      ]);

      return {
        summary: {
          totalUsers,
          totalEvents,
          pendingEventsCount,
          pendingOrganizersCount,
          confirmedBookingsCount,
          grossVolume: Number(revenueResult._sum.totalAmount || 0),
        },
        categoryDistribution: categoriesWithCounts.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.events,
          eventsCount: c._count.events,
        })),
        categories: categoriesWithCounts.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.events,
          eventsCount: c._count.events,
        })),
        recentUsers: recentUsers.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        })),
        recentBookings: recentBookings.map((b) => ({
          id: b.id,
          bookingReference: b.bookingReference,
          eventName: b.event.title,
          attendeeName: b.user.name,
          totalAmount: Number(b.totalAmount),
          createdAt: b.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getAdminOverview();
      }
      throw error;
    }
  }

  async getPendingEvents() {
    if (!isDatabaseConnected) {
      return devFallbackStore.getPendingEvents();
    }
    try {
      const events = await prisma.event.findMany({
        where: { status: EventStatus.PENDING_APPROVAL },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { organizationName: true, websiteUrl: true } },
            },
          },
          category: true,
          ticketTypes: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return events.map((e) => ({
        ...e,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }));
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getPendingEvents();
      }
      throw error;
    }
  }

  async reviewEvent(eventId: string, adminId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.reviewEvent(eventId, adminId, status, rejectionReason);
    }
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw AppError.notFound('Event not found');
      }

      if (event.status !== EventStatus.PENDING_APPROVAL) {
        throw AppError.badRequest(`Cannot review event in status '${event.status}'`);
      }

      const newStatus = status === 'APPROVED' ? EventStatus.APPROVED : EventStatus.REJECTED;

      const updated = await prisma.$transaction(async (tx) => {
        const updatedEvent = await tx.event.update({
          where: { id: eventId },
          data: {
            status: newStatus,
            rejectionReason: status === 'REJECTED' ? rejectionReason || 'Event submission does not meet guidelines.' : null,
          },
        });

        // Record approval log
        await tx.eventApproval.create({
          data: {
            eventId,
            adminId,
            status: newStatus,
            reason: rejectionReason,
          },
        });

        // Notify organizer
        await tx.notification.create({
          data: {
            userId: event.organizerId,
            title: status === 'APPROVED' ? 'Event Approved!' : 'Event Rejected',
            message:
              status === 'APPROVED'
                ? `Your event "${event.title}" has been approved! You can now publish it.`
                : `Your event "${event.title}" was rejected. Reason: ${rejectionReason || 'Does not meet guidelines.'}`,
            type: status === 'APPROVED' ? 'EVENT_APPROVED' : 'EVENT_REJECTED',
            link: `/organizer/events`,
          },
        });

        return updatedEvent;
      });

      return updated;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.reviewEvent(eventId, adminId, status, rejectionReason);
      }
      throw error;
    }
  }

  async getAllEvents(options: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getAllAdminEvents(options);
    }
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 20));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (options.status && options.status !== 'ALL') {
        where.status = options.status as EventStatus;
      }
      if (options.category && options.category !== 'ALL') {
        where.OR = [
          { categoryId: options.category },
          { category: { slug: options.category } },
        ];
      }
      if (options.search) {
        where.AND = [
          {
            OR: [
              { title: { contains: options.search, mode: 'insensitive' } },
              { description: { contains: options.search, mode: 'insensitive' } },
              { city: { contains: options.search, mode: 'insensitive' } },
              { venueName: { contains: options.search, mode: 'insensitive' } },
            ],
          },
        ];
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            category: true,
            organizer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            ticketTypes: true,
            _count: {
              select: { bookings: true },
            },
          },
        }),
        prisma.event.count({ where }),
      ]);

      return {
        events: events.map((e) => ({
          ...e,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate.toISOString(),
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getAllAdminEvents(options);
      }
      throw error;
    }
  }

  async getEventById(eventId: string) {
    if (!isDatabaseConnected) {
      const ev = devFallbackStore.events.find((e) => e.id === eventId);
      if (!ev) throw AppError.notFound('Event not found');
      return ev;
    }
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          category: true,
          organizer: {
            select: { id: true, name: true, email: true },
          },
          ticketTypes: true,
          _count: { select: { bookings: true } },
        },
      });
      if (!event) throw AppError.notFound('Event not found');
      return event;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        const ev = devFallbackStore.events.find((e) => e.id === eventId);
        if (!ev) throw AppError.notFound('Event not found');
        return ev;
      }
      throw error;
    }
  }

  async createEvent(adminId: string, input: any) {
    if (!isDatabaseConnected) {
      return devFallbackStore.createEvent(adminId, input);
    }
    try {
      const baseSlug = (input.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

      const status = input.status || EventStatus.PUBLISHED;

      const event = await prisma.event.create({
        data: {
          organizerId: adminId,
          categoryId: input.categoryId,
          title: input.title,
          slug,
          description: input.description,
          bannerUrl: input.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          timeZone: input.timeZone || 'UTC',
          isOnline: !!input.isOnline,
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          city: input.city,
          capacity: Number(input.capacity || 100),
          cancellationPolicy: input.cancellationPolicy || 'Standard refund policy',
          status,
          ticketTypes: {
            create: (input.ticketTypes && input.ticketTypes.length > 0
              ? input.ticketTypes
              : [{ name: 'General Admission', price: 0, totalQuantity: Number(input.capacity || 100), maxPerUser: 10 }]
            ).map((tt: any) => ({
              name: tt.name,
              description: tt.description,
              price: Number(tt.price || 0),
              totalQuantity: Number(tt.totalQuantity || 100),
              maxPerUser: Number(tt.maxPerUser || 10),
            })),
          },
        },
        include: {
          category: true,
          ticketTypes: true,
        },
      });

      return event;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.createEvent(adminId, input);
      }
      throw error;
    }
  }

  async updateEvent(eventId: string, input: any) {
    if (!isDatabaseConnected) {
      return devFallbackStore.updateEvent(eventId, 'admin', UserRole.ADMIN, input);
    }
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const ev = await tx.event.update({
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
            ...(input.capacity ? { capacity: Number(input.capacity) } : {}),
            ...(input.cancellationPolicy ? { cancellationPolicy: input.cancellationPolicy } : {}),
            ...(input.status ? { status: input.status as EventStatus } : {}),
          },
          include: {
            category: true,
            ticketTypes: true,
          },
        });

        if (Array.isArray(input.ticketTypes) && input.ticketTypes.length > 0) {
          for (const tt of input.ticketTypes) {
            if (tt.id) {
              await tx.ticketType.updateMany({
                where: { id: tt.id, eventId },
                data: {
                  name: tt.name,
                  price: Number(tt.price || 0),
                  totalQuantity: Number(tt.totalQuantity || 50),
                },
              });
            } else {
              await tx.ticketType.create({
                data: {
                  eventId,
                  name: tt.name,
                  price: Number(tt.price || 0),
                  totalQuantity: Number(tt.totalQuantity || 50),
                  maxPerUser: Number(tt.maxPerUser || 10),
                },
              });
            }
          }
        }

        return ev;
      });

      return updated;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.updateEvent(eventId, 'admin', UserRole.ADMIN, input);
      }
      throw error;
    }
  }

  async updateEventStatus(eventId: string, status: EventStatus, reason?: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.adminUpdateEventStatus(eventId, status, reason);
    }
    try {
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          status,
          ...(reason !== undefined ? { rejectionReason: reason } : {}),
        },
        include: {
          category: true,
          ticketTypes: true,
        },
      });
      return updated;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.adminUpdateEventStatus(eventId, status, reason);
      }
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.adminDeleteEvent(eventId);
    }
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { bookings: true } } },
      });
      if (!event) throw AppError.notFound('Event not found');

      const bookingsCount = event._count.bookings;

      await prisma.$transaction(async (tx) => {
        await tx.eventApproval.deleteMany({ where: { eventId } });
        await tx.savedEvent.deleteMany({ where: { eventId } });
        await tx.inventoryReservation.deleteMany({ where: { eventId } });
        await tx.ticketType.deleteMany({ where: { eventId } });
        await tx.event.delete({ where: { id: eventId } });
      });

      return {
        success: true,
        message: `Event "${event.title}" permanently deleted.`,
        bookingsAffected: bookingsCount,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.adminDeleteEvent(eventId);
      }
      throw error;
    }
  }

  async getOrganizerRequests(status?: OrganizerRequestStatus) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getOrganizerRequests(status);
    }
    try {
      const where: any = {};
      if (status) {
        where.status = status;
      }

      const requests = await prisma.organizerRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return requests.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        user: {
          ...r.user,
          createdAt: r.user.createdAt.toISOString(),
        },
      }));
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getOrganizerRequests(status);
      }
      throw error;
    }
  }

  async reviewOrganizerRequest(
    requestId: string,
    adminId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) {
    if (!isDatabaseConnected) {
      return devFallbackStore.reviewOrganizerRequest(requestId, adminId, decision, rejectionReason);
    }
    try {
      const request = await prisma.organizerRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!request) {
        throw AppError.notFound('Organizer request not found');
      }

      if (request.status !== OrganizerRequestStatus.PENDING) {
        throw AppError.badRequest(`Request has already been ${request.status}`);
      }

      const newStatus = decision === 'APPROVED' ? OrganizerRequestStatus.APPROVED : OrganizerRequestStatus.REJECTED;

      const result = await prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.organizerRequest.update({
          where: { id: requestId },
          data: {
            status: newStatus,
            reviewedById: adminId,
            reviewedAt: new Date(),
            rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
          },
        });

        if (decision === 'APPROVED') {
          // Upgrade user to ORGANIZER
          await tx.user.update({
            where: { id: request.userId },
            data: { role: UserRole.ORGANIZER },
          });

          // Update organization name in profile if provided
          await tx.userProfile.upsert({
            where: { userId: request.userId },
            create: {
              userId: request.userId,
              organizationName: request.organizationName,
              websiteUrl: request.websiteUrl,
            },
            update: {
              organizationName: request.organizationName,
              websiteUrl: request.websiteUrl,
            },
          });
        }

        // Notify applicant
        await tx.notification.create({
          data: {
            userId: request.userId,
            title: decision === 'APPROVED' ? 'Organizer Privileges Granted!' : 'Organizer Request Not Approved',
            message:
              decision === 'APPROVED'
                ? `Congratulations! Your request to host events as "${request.organizationName}" has been approved.`
                : `Your organizer request was not approved. Reason: ${rejectionReason || 'Criteria not met.'}`,
            type: decision === 'APPROVED' ? 'ORGANIZER_APPROVED' : 'ORGANIZER_REJECTED',
            link: decision === 'APPROVED' ? '/organizer/events' : '/profile',
          },
        });

        return updatedRequest;
      });

      return result;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.reviewOrganizerRequest(requestId, adminId, decision, rejectionReason);
      }
      throw error;
    }
  }

  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: UserRole,
    status?: AccountStatus
  ) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getUsers(page, limit, search, role, status);
    }
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            profile: true,
            _count: {
              select: {
                events: true,
                bookings: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          phone: u.profile?.phone || null,
          organizationName: u.profile?.organizationName || null,
          eventsCount: u._count.events,
          bookingsCount: u._count.bookings,
          createdAt: u.createdAt.toISOString(),
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getUsers(page, limit, search, role, status);
      }
      throw error;
    }
  }

  async getUserDetails(userId: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getUserDetails(userId);
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          _count: {
            select: {
              events: true,
              bookings: true,
              savedEvents: true,
            },
          },
          bookings: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              event: {
                select: {
                  title: true,
                },
              },
            },
          },
          events: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
            },
          },
        },
      });

      if (!user) {
        throw AppError.notFound('User not found');
      }

      const confirmedBookings = await prisma.booking.aggregate({
        where: {
          userId,
          status: BookingStatus.CONFIRMED,
        },
        _sum: {
          totalAmount: true,
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        profile: {
          bio: user.profile?.bio || null,
          phone: user.profile?.phone || null,
          avatarUrl: user.profile?.avatarUrl || null,
          organizationName: user.profile?.organizationName || null,
          websiteUrl: user.profile?.websiteUrl || null,
        },
        stats: {
          bookingsCount: user._count.bookings,
          eventsCount: user._count.events,
          savedEventsCount: user._count.savedEvents,
          totalSpent: Number(confirmedBookings._sum.totalAmount || 0),
        },
        hasAssociatedRecords: user._count.bookings > 0 || user._count.events > 0,
        recentBookings: user.bookings.map((b) => ({
          id: b.id,
          bookingReference: b.bookingReference,
          totalAmount: Number(b.totalAmount),
          status: b.status,
          eventTitle: b.event?.title || 'Event',
          createdAt: b.createdAt.toISOString(),
        })),
        recentEvents: user.events.map((e) => ({
          id: e.id,
          title: e.title,
          status: e.status,
          startDate: e.startDate.toISOString(),
        })),
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getUserDetails(userId);
      }
      throw error;
    }
  }

  async deleteUser(
    targetUserId: string,
    adminId: string,
    options?: { action?: 'delete' | 'deactivate' | 'permanent' }
  ) {
    if (targetUserId === adminId) {
      throw AppError.badRequest('You cannot delete your own administrator account.');
    }

    if (!isDatabaseConnected) {
      return devFallbackStore.deleteUser(targetUserId, adminId, options);
    }

    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          _count: {
            select: {
              bookings: true,
              events: true,
            },
          },
        },
      });

      if (!targetUser) {
        throw AppError.notFound('User not found');
      }

      if (targetUser.role === UserRole.ADMIN) {
        const activeAdminsCount = await prisma.user.count({
          where: { role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
        });
        if (activeAdminsCount <= 1) {
          throw AppError.badRequest('Cannot delete or remove the last active platform administrator account.');
        }
      }

      const bookingsCount = targetUser._count.bookings;
      const eventsCount = targetUser._count.events;
      const hasAssociated = bookingsCount > 0 || eventsCount > 0;

      if (options?.action === 'deactivate' || (hasAssociated && options?.action !== 'permanent')) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { status: AccountStatus.SUSPENDED },
        });

        await prisma.auditLog.create({
          data: {
            userId: adminId,
            action: 'USER_DEACTIVATED',
            entityType: 'USER',
            entityId: targetUserId,
            details: `Admin deactivated user to preserve ${bookingsCount} booking(s) and transaction history.`,
          },
        });

        return {
          success: true,
          action: 'deactivated',
          message: `User account for "${targetUser.name}" has been deactivated to preserve their ${bookingsCount} booking(s) and transaction records.`,
          user: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            status: AccountStatus.SUSPENDED,
          },
          bookingsPreserved: bookingsCount,
          eventsPreserved: eventsCount,
        };
      } else {
        await prisma.user.delete({
          where: { id: targetUserId },
        });

        await prisma.auditLog.create({
          data: {
            userId: adminId,
            action: 'USER_DELETED',
            entityType: 'USER',
            entityId: targetUserId,
            details: 'Admin permanently removed user account.',
          },
        });

        return {
          success: true,
          action: 'deleted',
          message: `User account for "${targetUser.name}" (${targetUser.email}) has been permanently deleted.`,
          user: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
          },
        };
      }
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.deleteUser(targetUserId, adminId, options);
      }
      throw error;
    }
  }

  async updateUserStatus(targetUserId: string, adminId: string, status: AccountStatus, reason?: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.updateUserStatus(targetUserId, adminId, status, reason);
    }
    try {
      if (targetUserId === adminId) {
        throw AppError.badRequest('Administrators cannot change their own account status');
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!targetUser) {
        throw AppError.notFound('User not found');
      }

      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { status },
        select: { id: true, name: true, email: true, role: true, status: true },
      });

      // Record audit log
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: `USER_STATUS_${status}`,
          entityType: 'USER',
          entityId: targetUserId,
          details: reason || `Admin updated status to ${status}`,
        },
      });

      return updated;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.updateUserStatus(targetUserId, adminId, status, reason);
      }
      throw error;
    }
  }

  async getAllBookings(options?: { search?: string; status?: string; page?: number; limit?: number }) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getAllAdminBookings(options);
    }
    try {
      const page = Math.max(1, options?.page || 1);
      const limit = Math.min(100, Math.max(1, options?.limit || 20));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (options?.status && options.status !== 'ALL') {
        where.status = options.status;
      }
      if (options?.search) {
        where.OR = [
          { bookingReference: { contains: options.search, mode: 'insensitive' } },
          { user: { name: { contains: options.search, mode: 'insensitive' } } },
          { user: { email: { contains: options.search, mode: 'insensitive' } } },
          { event: { title: { contains: options.search, mode: 'insensitive' } } },
        ];
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            event: { select: { id: true, title: true, startDate: true } },
            tickets: {
              include: { ticketType: { select: { name: true, price: true } } },
            },
            payments: true,
          },
        }),
        prisma.booking.count({ where }),
      ]);

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingReference: b.bookingReference,
          userId: b.userId,
          eventId: b.eventId,
          totalAmount: Number(b.totalAmount),
          status: b.status,
          createdAt: b.createdAt.toISOString(),
          cancelledAt: b.cancelledAt?.toISOString() || null,
          cancellationReason: b.cancellationReason || null,
          user: b.user,
          event: {
            id: b.event.id,
            title: b.event.title,
            startDate: b.event.startDate.toISOString(),
          },
          ticketsCount: b.tickets.length,
          tickets: b.tickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            status: t.status,
            ticketTypeName: t.ticketType.name,
            price: Number(t.ticketType.price),
          })),
        })),
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getAllAdminBookings(options);
      }
      throw error;
    }
  }

  async broadcastNotification(input: { title: string; message: string; targetRole?: string }) {
    if (!isDatabaseConnected) {
      return devFallbackStore.broadcastNotification(input);
    }
    try {
      const userWhere: any = {};
      if (input.targetRole && input.targetRole !== 'ALL') {
        userWhere.role = input.targetRole;
      }
      const users = await prisma.user.findMany({
        where: userWhere,
        select: { id: true },
      });

      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: input.title,
          message: input.message,
          type: 'SYSTEM_ANNOUNCEMENT',
        })),
      });

      return {
        success: true,
        deliveredCount: users.length,
        message: `Announcement broadcast successfully delivered to ${users.length} user(s).`,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.broadcastNotification(input);
      }
      throw error;
    }
  }

  async getAdminNotifications(page: number = 1, limit: number = 20) {
    if (!isDatabaseConnected) {
      const all = [...devFallbackStore.notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        notifications: all.slice((page - 1) * limit, page * limit),
        total: all.length,
      };
    }
    try {
      const skip = (page - 1) * limit;
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } },
        }),
        prisma.notification.count(),
      ]);
      return { notifications, total };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        const all = [...devFallbackStore.notifications].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return {
          notifications: all.slice((page - 1) * limit, page * limit),
          total: all.length,
        };
      }
      throw error;
    }
  }
}

export const adminService = new AdminService();
