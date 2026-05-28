import { prisma } from '@/lib/prisma/client'
import type { User } from '@prisma/client'

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } })
}

export async function updateUserSettings(
  id: string,
  data: { hourlyRate?: number; payPeriodStart?: number; emailSummary?: boolean; timezone?: string }
): Promise<User> {
  return prisma.user.update({ where: { id }, data })
}

export async function getAllUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
}
