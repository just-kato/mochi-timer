import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  createTestSession,
  deleteTestSessions,
  signInAsUser,
} from './fixtures/helpers'

const EMAIL = 'test-sessions@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe('Sessions — edit, delete, history', () => {
  let userId: string
  let sessionId: string

  const startBase = new Date()
  startBase.setDate(startBase.getDate() - 1)
  startBase.setHours(9, 0, 0, 0)
  const endBase = new Date(startBase)
  endBase.setHours(11, 0, 0, 0)

  test.beforeAll(async () => {
    userId = await createTestUser(EMAIL, PASSWORD, 'user')
    // Seed 25 sessions so pagination can be tested
    const promises: Promise<string>[] = []
    for (let i = 0; i < 25; i++) {
      const s = new Date(startBase)
      s.setDate(s.getDate() - i)
      const e = new Date(s)
      e.setHours(e.getHours() + 2)
      promises.push(createTestSession(userId, s, e, `Session ${i + 1}`))
    }
    const ids = await Promise.all(promises)
    sessionId = ids[0]
  })

  test.afterAll(async () => {
    await deleteTestSessions(userId)
    await deleteTestUser(userId)
  })

  // ── API-level tests (no browser needed, use page.request) ──────────────────

  test.skip('PATCH updates times and recalculates duration', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    const newStart = new Date(startBase)
    newStart.setHours(8, 30, 0, 0)
    const newEnd = new Date(startBase)
    newEnd.setHours(11, 30, 0, 0)
    const expectedDuration = Math.floor((newEnd.getTime() - newStart.getTime()) / 1000)

    const res = await page.request.patch(`/api/sessions/${sessionId}`, {
      data: {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      },
    })
    expect(res.status()).toBe(200)
    const data = await res.json() as { session: { duration: number; startTime: string } }
    expect(data.session.duration).toBe(expectedDuration)
    expect(new Date(data.session.startTime).getTime()).toBe(newStart.getTime())
  })

  test.skip('PATCH returns 422 when endTime is before startTime', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    const res = await page.request.patch(`/api/sessions/${sessionId}`, {
      data: {
        startTime: endBase.toISOString(),
        endTime: startBase.toISOString(),
      },
    })
    expect(res.status()).toBe(422)
  })

  test.skip('PATCH returns 403 for another user session', async ({ page }) => {
    const otherEmail = `other-sessions-${Date.now()}@mochi-test.dev`
    const otherId = await createTestUser(otherEmail, PASSWORD, 'user')
    await signInAsUser(page, otherEmail, PASSWORD)

    const res = await page.request.patch(`/api/sessions/${sessionId}`, {
      data: { notes: 'hacked' },
    })
    expect(res.status()).toBe(403)

    await deleteTestUser(otherId)
  })

  test.skip('DELETE removes the session', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    const toDelete = await createTestSession(userId, startBase, endBase, 'to be deleted')

    const res = await page.request.delete(`/api/sessions/${toDelete}`)
    expect(res.status()).toBe(200)

    const check = await page.request.get(`/api/sessions/history?page=1`)
    const data = await check.json() as { sessions: { id: string }[] }
    expect(data.sessions.find((s) => s.id === toDelete)).toBeUndefined()
  })

  test.skip('DELETE returns 403 for another user session', async ({ page }) => {
    const otherEmail = `other-del-${Date.now()}@mochi-test.dev`
    const otherId = await createTestUser(otherEmail, PASSWORD, 'user')
    await signInAsUser(page, otherEmail, PASSWORD)

    const res = await page.request.delete(`/api/sessions/${sessionId}`)
    expect(res.status()).toBe(403)

    await deleteTestUser(otherId)
  })

  test.skip('GET /api/sessions/history paginates correctly', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    const page1 = await page.request.get('/api/sessions/history?page=1')
    const d1 = await page1.json() as { sessions: unknown[]; total: number; pageSize: number }
    expect(d1.sessions.length).toBe(d1.pageSize)
    expect(d1.total).toBeGreaterThanOrEqual(25)

    const page2 = await page.request.get('/api/sessions/history?page=2')
    const d2 = await page2.json() as { sessions: unknown[]; page: number }
    expect(d2.page).toBe(2)
    expect(d2.sessions.length).toBeGreaterThan(0)
  })

  test.skip('GET /api/sessions/history floors invalid page to 1', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    const r0 = await page.request.get('/api/sessions/history?page=0')
    const d0 = await r0.json() as { page: number }
    expect(d0.page).toBe(1)

    const rBad = await page.request.get('/api/sessions/history?page=abc')
    const dBad = await rBad.json() as { page: number }
    expect(dBad.page).toBe(1)
  })

  // ── Browser UI tests ────────────────────────────────────────────────────────

  test.skip('history tab shows paginated sessions', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'History' }).click()
    await expect(page.locator('li').first()).toBeVisible()
    const items = page.locator('li')
    await expect(items).toHaveCount(20)
  })

  test.skip('history tab — next page loads', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'History' }).click()
    await expect(page.locator('li').first()).toBeVisible()

    const responsePromise = page.waitForResponse(r => r.url().includes('/api/sessions/history?page=2'))
    await page.getByRole('button', { name: 'Next →' }).click()
    await responsePromise
    await expect(page.getByText('2 / ')).toBeVisible()
    const items = page.locator('li')
    await expect(items.first()).toBeVisible()
  })

  test('timer page — edit session updates displayed duration', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    // Create a fresh session for today that will appear in the timer page list
    const todayStart = new Date()
    todayStart.setHours(8, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(10, 0, 0, 0)
    const freshId = await createTestSession(userId, todayStart, todayEnd, 'edit-test')

    await page.goto('/timer')
    await expect(page.locator(`text=edit-test`)).toBeVisible()

    // Click Edit on the session
    const editBtn = page.locator('li').filter({ hasText: 'edit-test' }).getByRole('button', { name: 'Edit session' })
    await editBtn.click()

    // Change start time to 1 hour later (reducing duration by 1h)
    const newStart = new Date(todayStart)
    newStart.setHours(9, 0, 0, 0)
    const fmt = (d: Date) => {
      const y = d.getFullYear()
      const mo = String(d.getMonth() + 1).padStart(2, '0')
      const dy = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const mi = String(d.getMinutes()).padStart(2, '0')
      return `${y}-${mo}-${dy}T${h}:${mi}`
    }
    await page.locator('#edit-start').fill(fmt(newStart))
    await page.getByRole('dialog', { name: 'Edit session' }).getByRole('button', { name: 'Save' }).click()

    // Modal should close and duration should update to 1:00:00
    await expect(page.getByRole('dialog', { name: 'Edit session' })).not.toBeVisible()
    await expect(page.locator('li').filter({ hasText: 'edit-test' }).getByText('01:00:00')).toBeVisible()

    // Cleanup
    await page.request.delete(`/api/sessions/${freshId}`)
  })

  test('timer page — delete session removes it from list', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    const todayStart = new Date()
    todayStart.setHours(7, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(8, 0, 0, 0)
    await createTestSession(userId, todayStart, todayEnd, 'delete-me')

    await page.goto('/timer')
    await expect(page.locator('text=delete-me')).toBeVisible()

    const delBtn = page.locator('li').filter({ hasText: 'delete-me' }).getByRole('button', { name: 'Delete session' })
    await delBtn.click()

    const confirmBtn = page.locator('li').filter({ hasText: 'delete-me' }).getByRole('button', { name: 'Confirm' })
    await confirmBtn.click()

    await expect(page.locator('text=delete-me')).not.toBeVisible({ timeout: 5000 })
  })

  test.skip('edit modal cancel — no changes saved', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)

    const todayStart = new Date()
    todayStart.setHours(6, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(7, 0, 0, 0)
    const freshId = await createTestSession(userId, todayStart, todayEnd, 'cancel-test')

    await page.goto('/timer')
    await expect(page.locator('text=cancel-test')).toBeVisible()

    const editBtn = page.locator('li').filter({ hasText: 'cancel-test' }).getByRole('button', { name: 'Edit session' })
    await editBtn.click()
    await expect(page.getByRole('dialog', { name: 'Edit session' })).toBeVisible()

    // Change something but cancel
    await page.getByRole('dialog', { name: 'Edit session' }).getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog', { name: 'Edit session' })).not.toBeVisible()

    // Original duration still shown (1:00:00)
    await expect(page.locator('li').filter({ hasText: 'cancel-test' }).getByText('01:00:00')).toBeVisible()

    await page.request.delete(`/api/sessions/${freshId}`)
  })
})
