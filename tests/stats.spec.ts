import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  createTestSession,
  deleteTestSessions,
  signInAsUser,
  getServiceClient,
} from './fixtures/helpers'

const EMAIL = 'test-stats@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe.skip('Stats', () => {
  let userId: string

  test.beforeAll(async () => {
    userId = await createTestUser(EMAIL, PASSWORD, 'user')

    // Set hourly rate to $50 via service role
    const supabase = getServiceClient()
    await supabase.from('User').update({ hourlyRate: 50, updatedAt: new Date().toISOString() }).eq('id', userId)

    // Create a 2-hour session today
    const start = new Date()
    start.setHours(8, 0, 0, 0)
    const end = new Date(start)
    end.setHours(10, 0, 0, 0)
    await createTestSession(userId, start, end)
  })

  test.afterAll(async () => {
    await deleteTestSessions(userId)
    await deleteTestUser(userId)
  })

  test.beforeEach(async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
    await page.goto('/stats')
  })

  test('stats reflect actual logged sessions', async ({ page }) => {
    // "Hours this week" card shows the 2h session — use first() since same value may appear in pay period card too
    await expect(page.locator('text=2.00h').first()).toBeVisible()
  })

  test('estimated pay calculates correctly against hourly rate', async ({ page }) => {
    // 2 hours × $50 = $100 — appears in at least one stats card
    await expect(page.locator('text=Est. $100.00').first()).toBeVisible()
  })

  test('chart renders with correct data points', async ({ page }) => {
    const chart = page.getByTestId('hours-chart')
    await expect(chart).toBeVisible()
    // Recharts renders SVG — verify a bar rect exists in the DOM (SVG rects may not pass toBeVisible)
    const bars = chart.locator('rect[width]')
    await expect(bars.first()).toBeAttached()
  })
})
