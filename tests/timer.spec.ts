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
    // Elapsed counter should be ticking
    const elapsed1 = await page.getByRole('status').textContent()
    await page.waitForTimeout(1100)
    const elapsed2 = await page.getByRole('status').textContent()
    expect(elapsed1).not.toEqual(elapsed2)
  })

  test('stop timer — verify session saved with UUID and UTC timestamp', async ({ page }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Stop timer' }).click()
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()

    // Session should appear in today's list
    const sessionItems = page.locator('li')
    await expect(sessionItems.first()).toBeVisible()

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

  test('timer persists after page refresh', async ({ page }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()

    // Clean up
    await page.getByRole('button', { name: 'Stop timer' }).click()
  })

  test('stopped session cannot be edited — API returns 409', async ({ page }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Stop timer' }).click()
    await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()

    const res1 = await page.request.get(`/api/sessions?date=${new Date().toISOString().split('T')[0]}`)
    const data = await res1.json()
    const session = data.sessions[data.sessions.length - 1]

    // Attempt to stop an already-stopped session
    const res2 = await page.request.fetch(`/api/sessions/${session.id}/stop`, {
      method: 'PATCH',
      data: { endTime: new Date().toISOString() },
    })
    expect(res2.status()).toBe(409)
  })
})
