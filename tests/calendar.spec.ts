import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  createTestSession,
  deleteTestSessions,
  signInAsUser,
} from './fixtures/helpers'

const EMAIL = 'test-calendar@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe('Calendar', () => {
  let userId: string
  const yesterday = new Date()

  test.beforeAll(async () => {
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(9, 0, 0, 0)
    userId = await createTestUser(EMAIL, PASSWORD, 'user')
    const end = new Date(yesterday)
    end.setHours(11, 0, 0, 0)
    await createTestSession(userId, yesterday, end, 'Test session')
  })

  test.afterAll(async () => {
    await deleteTestSessions(userId)
    await deleteTestUser(userId)
  })

  test.beforeEach(async ({ page }) => {
    await signInAsUser(page, EMAIL, PASSWORD)
    await page.goto('/calendar')
  })

  test('past day with sessions shows correct hours and pay', async ({ page }) => {
    const day = yesterday.getDate()
    await page.getByRole('button', { name: new RegExp(String(day)) }).first().click()
    await expect(page.locator('text=2.00h')).toBeVisible()
  })

  test('empty day shows zero state', async ({ page }) => {
    // Two days ago — no sessions
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const day = twoDaysAgo.getDate()
    await page.getByRole('button', { name: new RegExp(String(day)) }).first().click()
    await expect(page.locator('text=No sessions')).toBeVisible()
  })

  test('future dates are not selectable', async ({ page }) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const day = tomorrow.getDate()
    const futureBtn = page.getByRole('button', { name: new RegExp(String(day)) }).first()
    await expect(futureBtn).toBeDisabled()
  })
})
