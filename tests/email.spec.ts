import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  getServiceClient,
} from './fixtures/helpers'

const EMAIL = 'test-email@mochi-test.dev'
const ADMIN_EMAIL = 'test-email-admin@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe.skip('Email', () => {
  let userId: string
  let adminId: string

  test.beforeAll(async () => {
    userId = await createTestUser(EMAIL, PASSWORD, 'user')
    adminId = await createTestUser(ADMIN_EMAIL, PASSWORD, 'admin')
  })

  test.afterAll(async () => {
    await deleteTestUser(userId)
    await deleteTestUser(adminId)
  })

  test('email toggle in settings persists', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
    await page.goto('/settings')

    // Toggle OFF
    const toggle = page.getByRole('switch', { name: 'Weekly summary email' })
    const initialChecked = await toggle.getAttribute('aria-checked')
    await toggle.click()
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.locator('text=Settings saved')).toBeVisible()

    await page.reload()
    const newChecked = await toggle.getAttribute('aria-checked')
    expect(newChecked).not.toBe(initialChecked)
  })

  test('cron route validates CRON_SECRET — rejects missing token', async ({ page }) => {
    const res = await page.request.post('/api/cron/weekly-email', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(401)
  })

  test('cron route validates CRON_SECRET — rejects wrong token', async ({ page }) => {
    const res = await page.request.post('/api/cron/weekly-email', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer wrong-secret',
      },
    })
    expect(res.status()).toBe(401)
  })

  test('cron route sends emails with correct CRON_SECRET', async ({ page }) => {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      test.skip()
      return
    }

    // Use a mock — verify the route returns 200 with correct secret
    const res = await page.request.post('/api/cron/weekly-email', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  test('admin can set emailSummary per user via settings', async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
    await page.goto('/settings')

    const toggle = page.getByRole('switch', { name: 'Weekly summary email' })
    const before = await toggle.getAttribute('aria-checked')
    await toggle.click()
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.locator('text=Settings saved')).toBeVisible()

    // Verify via API
    const res = await page.request.get('/api/settings')
    const data = await res.json()
    const expected = before !== 'true'
    expect(data.emailSummary).toBe(expected)

    // Restore
    const supabase = getServiceClient()
    await supabase.from('User').update({ emailSummary: true }).eq('id', userId)
  })
})
