import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  // Use the pooled DATABASE_URL (pgBouncer on port 6543) — the direct DIRECT_URL
  // (port 5432) is only reachable from Vercel's network. Strip ?pgbouncer=true
  // because the pg driver doesn't understand it and pgBouncer rejects the parameter.
  const rawUrl = process.env.DATABASE_URL
  const connectionString = rawUrl?.replace(/[?&]pgbouncer=true/gi, '')
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
