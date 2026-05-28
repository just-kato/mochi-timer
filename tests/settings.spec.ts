import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  createTestSession,
  deleteTestSessions,
  signInAsUser,
} from './fixtures/helpers'

const EMAIL = 'test-settings@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe('Settings', () => {
  let userId: string

  test.beforeAll(async () => {
    userId = await createTestUser(EMAIL, PASSWORD, 'user')
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
    await page.goto('/settings')
  })

  test('hourly rate saves and reflects in stats', async ({ page }) => {
    await page.locator('#hourlyRate').fill('75')
    await page.getByRole('button', { name: 'SAVE SETTINGS' }).click()
    await expect(page.locator('text=SETTINGS SAVED')).toBeVisible()

    // Navigate to stats and verify pay = 2h × $75 = $150
    await page.goto('/stats')
    await expect(page.locator('text=Est. $150.00').first()).toBeVisible()
  })

  test('pay period start day updates and persists', async ({ page }) => {
    await page.locator('#payPeriodStart').selectOption('0') // Sunday
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.locator('text=Settings saved')).toBeVisible()

    // Reload and verify persisted
    await page.reload()
    await expect(page.locator('#payPeriodStart')).toHaveValue('0')
  })
})
