import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  deleteTestSessions,
  signInAsUser,
} from './fixtures/helpers'

const EMAIL = 'test-timer@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe('Timer', () => {
  let userId: string

  test.beforeAll(async () => {
    userId = await createTestUser(EMAIL, PASSWORD, 'user')
  })

  test.afterAll(async () => {
    await deleteTestSessions(userId)
    await deleteTestUser(userId)
  })

  test.beforeEach(async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
  })

  test('start timer — verify it is running', async ({ page }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()

    // Wait for the elapsed counter to appear, then wait for it to change
    const status = page.getByRole('status')
    await expect(status).toBeVisible()
    const initial = await status.textContent()
    await expect(status).not.toHaveText(initial ?? '')

    // Clean up — stop the timer so subsequent tests start from a clean state
    await page.getByRole('button', { name: 'Stop timer' }).click()
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()
  })

  test('stop timer — verify session saved with UUID and UTC timestamp', async ({ page }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    // Wait until at least 1 second has elapsed so duration > 0
    await expect(page.getByRole('status')).not.toHaveText('00:00:00', { timeout: 5000 })
    await page.getByRole('button', { name: 'Stop timer' }).click()
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()

    // Session should appear in today's list
    await expect(page.locator('li').first()).toBeVisible()

    // Verify via API that session has UUID and UTC timestamps
    const res = await page.request.get(`/api/sessions?date=${new Date().toISOString().split('T')[0]}`)
    const data = await res.json()
    expect(data.sessions.length).toBeGreaterThan(0)
    const session = data.sessions[data.sessions.length - 1]
    expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(session.startTime).toMatch(/Z$/)
    expect(session.endTime).toMatch(/Z$/)
    expect(session.duration).toBeGreaterThan(0)
  })

  test.skip('timer persists after page refresh', async ({ page }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()

    await page.getByRole('button', { name: 'Stop timer' }).click()
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()
  })

  test.skip('stopped session cannot be edited — API returns 409', async ({ page }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()
    await page.getByRole('button', { name: 'Stop timer' }).click()
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()

    const res1 = await page.request.get(`/api/sessions?date=${new Date().toISOString().split('T')[0]}`)
    const data = await res1.json()
    const session = data.sessions[data.sessions.length - 1]

    // Attempt to stop an already-stopped session — must return 409
    const res2 = await page.request.fetch(`/api/sessions/${session.id}/stop`, {
      method: 'PATCH',
      data: { endTime: new Date().toISOString() },
    })
    expect(res2.status()).toBe(409)
  })
})
