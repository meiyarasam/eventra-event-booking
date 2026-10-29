import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import {
  UpdateProfileInput,
  ChangePasswordInput,
  OrganizerRequestInput,
  OrganizerRequestStatus,
  UserRole,
} from '@eventra/shared';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';

export class UsersService {
  async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          organizerRequests: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!user) {
        throw AppError.notFound('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        avatarUrl: user.profile?.avatarUrl || null,
        phone: user.profile?.phone || null,
        bio: user.profile?.bio || null,
        organizationName: user.profile?.organizationName || null,
        websiteUrl: user.profile?.websiteUrl || null,
        latestOrganizerRequest: user.organizerRequests[0] || null,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getUserProfile(userId);
      }
      throw error;
    }
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user) {
        throw AppError.notFound('User not found');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name ? { name: input.name } : {}),
          profile: {
            upsert: {
              create: {
                phone: input.phone,
                bio: input.bio,
                avatarUrl: input.avatarUrl,
              },
              update: {
                phone: input.phone,
                bio: input.bio,
                avatarUrl: input.avatarUrl,
              },
            },
          },
        },
        include: { profile: true },
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
        avatarUrl: updatedUser.profile?.avatarUrl || null,
        phone: updatedUser.profile?.phone || null,
        bio: updatedUser.profile?.bio || null,
        createdAt: updatedUser.createdAt.toISOString(),
      };
    } catch (error) {
      // FIX BUG-005: Handle DB connection failure with fallback store update.
      if (isPrismaConnectionError(error)) {
        const fbUser = devFallbackStore.users.find((u) => u.id === userId);
        if (!fbUser) {
          throw AppError.notFound('User not found');
        }
        if (input.name) fbUser.name = input.name;
        if (fbUser.profile === undefined) fbUser.profile = {};
        if (input.phone !== undefined) fbUser.profile.phone = input.phone ?? null;
        if (input.bio !== undefined) fbUser.profile.bio = input.bio ?? null;
        if (input.avatarUrl !== undefined) fbUser.profile.avatarUrl = input.avatarUrl ?? null;
        return {
          id: fbUser.id,
          email: fbUser.email,
          name: fbUser.name,
          role: fbUser.role,
          status: fbUser.status,
          avatarUrl: fbUser.profile?.avatarUrl || null,
          phone: fbUser.profile?.phone || null,
          bio: fbUser.profile?.bio || null,
          createdAt: fbUser.createdAt instanceof Date ? fbUser.createdAt.toISOString() : new Date().toISOString(),
        };
      }
      throw error;
    }
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw AppError.notFound('User not found');
      }

      const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw AppError.badRequest('Current password is incorrect');
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(input.newPassword, salt);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
      // FIX BUG-005: Handle DB connection failure with fallback store update.
      if (isPrismaConnectionError(error)) {
        const fbUser = devFallbackStore.users.find((u) => u.id === userId);
        if (!fbUser) {
          throw AppError.notFound('User not found');
        }
        const isMatch = await bcrypt.compare(input.currentPassword, fbUser.passwordHash);
        if (!isMatch) {
          throw AppError.badRequest('Current password is incorrect');
        }
        const salt = await bcrypt.genSalt(10);
        fbUser.passwordHash = await bcrypt.hash(input.newPassword, salt);
        return { message: 'Password updated successfully' };
      }
      throw error;
    }
  }

  async submitOrganizerRequest(userId: string, input: OrganizerRequestInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN) {
      throw AppError.badRequest('You already have organizer privileges.');
    }

    const existingPending = await prisma.organizerRequest.findFirst({
      where: {
        userId,
        status: OrganizerRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw AppError.conflict('You already have a pending organizer request under review.');
    }

    const request = await prisma.organizerRequest.create({
      data: {
        userId,
        organizationName: input.organizationName,
        reason: input.reason,
        websiteUrl: input.websiteUrl || null,
        status: OrganizerRequestStatus.PENDING,
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
          title: 'New Organizer Access Request',
          message: `${user.name} (${input.organizationName}) has requested organizer privileges.`,
          type: 'ADMIN_REQUEST',
          link: '/admin/organizers',
        },
      });
    }

    return request;
  }
}

export const usersService = new UsersService();
