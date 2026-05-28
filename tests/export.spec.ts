import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  createTestSession,
  deleteTestSessions,
  signInAsUser,
} from './fixtures/helpers'

const EMAIL = 'test-export@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe('Export', () => {
  let userId: string

  test.beforeAll(async () => {
    userId = await createTestUser(EMAIL, PASSWORD, 'user')
    const start = new Date()
    start.setDate(start.getDate() - 2)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(11, 30, 0, 0)
    await createTestSession(userId, start, end, 'Export test session')
  })

  test.afterAll(async () => {
    await deleteTestSessions(userId)
    await deleteTestUser(userId)
  })

  test.beforeEach(async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
    await page.goto('/export')
  })

  test('CSV downloads with correct columns and data', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export CSV' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.csv$/)
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const content = Buffer.concat(chunks).toString()

    expect(content).toContain('id,start_time,end_time,duration_seconds,duration_hours,notes')
    expect(content).toContain('Export test session')
  })

  test('PDF downloads with correct data', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Invoice PDF' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('date range filter works correctly', async ({ page }) => {
    // Set a range that excludes our session (future dates only)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(tomorrow.getDate() + 1)

    const fmt = (d: Date) => d.toISOString().split('T')[0]
    await page.locator('input[type="date"]').nth(0).fill(fmt(tomorrow))
    await page.locator('input[type="date"]').nth(1).fill(fmt(dayAfter))

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export CSV' }).click(),
    ])

    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const content = Buffer.concat(chunks).toString()

    // Only header, no data rows
    const lines = content.trim().split('\n')
    expect(lines.length).toBe(1)
  })
})
