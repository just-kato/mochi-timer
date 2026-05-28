import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  deleteTestSessions,
  signInAsUser,
} from './fixtures/helpers'

const EMAIL = 'test-offline@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe('Offline support', () => {
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

  test('simulate offline — start and stop timer — verify stored in IndexedDB', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)
    await expect(page.getByText(/offline/i)).toBeVisible()

    await page.getByRole('button', { name: 'Start timer' }).click()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()

    // Verify stored in IndexedDB using native browser API
    const idbActive = await page.evaluate(async () => {
      return new Promise<{ id: string; synced: boolean } | null>((resolve) => {
        const req = indexedDB.open('mochi-timer')
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('activeSession', 'readonly')
          const store = tx.objectStore('activeSession')
          const get = store.get('current')
          get.onsuccess = () => resolve(get.result ?? null)
          get.onerror = () => resolve(null)
        }
        req.onerror = () => resolve(null)
      })
    })
    expect(idbActive).toBeTruthy()
    expect(idbActive!.synced).toBe(false)

    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Stop timer' }).click()
    await context.setOffline(false)
  })

  test('simulate reconnect — verify session synced to Supabase', async ({ page, context }) => {
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Start timer' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Stop timer' }).click()

    // Back online triggers sync
    await context.setOffline(false)
    await expect(page.getByText(/back online/i)).toBeVisible()
    await page.waitForTimeout(2000)

    // Session should now be in Supabase
    const today = new Date().toISOString().split('T')[0]
    const res = await page.request.get(`/api/sessions?date=${today}`)
    const data = await res.json()
    expect(data.sessions.length).toBeGreaterThan(0)
  })

  test('start timer offline → reconnect → no duplicate session created', async ({ page, context }) => {
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Start timer' }).click()
    await page.waitForTimeout(500)

    await context.setOffline(false)
    await page.waitForTimeout(2000)

    // Only one active session should exist
    const today = new Date().toISOString().split('T')[0]
    const res = await page.request.get(`/api/sessions?date=${today}`)
    const data = await res.json()
    const runningSessions = data.sessions.filter((s: { endTime: string | null }) => !s.endTime)
    expect(runningSessions.length).toBeLessThanOrEqual(1)

    // Clean up
    if (runningSessions.length > 0) {
      await page.getByRole('button', { name: 'Stop timer' }).click()
    }
  })

  test('start online → go offline → stop → reconnect → correct endTime synced', async ({ page, context }) => {
    await page.getByRole('button', { name: 'Start timer' }).click()
    await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible()

    await context.setOffline(true)
    const stopTime = new Date()
    await page.getByRole('button', { name: 'Stop timer' }).click()

    await context.setOffline(false)
    await page.waitForTimeout(2000)

    const today = new Date().toISOString().split('T')[0]
    const res = await page.request.get(`/api/sessions?date=${today}`)
    const data = await res.json()
    const stopped = data.sessions.filter((s: { endTime: string | null }) => s.endTime !== null)
    expect(stopped.length).toBeGreaterThan(0)

    const latest = stopped[stopped.length - 1]
    const syncedEnd = new Date(latest.endTime).getTime()
    // endTime should be within 5 seconds of when we clicked stop
    expect(Math.abs(syncedEnd - stopTime.getTime())).toBeLessThan(5000)
  })
})
