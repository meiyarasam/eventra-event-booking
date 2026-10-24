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
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
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
