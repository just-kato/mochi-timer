import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser } from './fixtures/helpers'

const TEST_EMAIL = 'test-auth-user@mochi-test.dev'
const ADMIN_EMAIL = 'test-auth-admin@mochi-test.dev'
const TEST_PASSWORD = 'testpassword123!'

test.describe('Auth', () => {
  let userId: string
  let adminId: string

  test.beforeAll(async () => {
    userId = await createTestUser(TEST_EMAIL, TEST_PASSWORD, 'user')
    adminId = await createTestUser(ADMIN_EMAIL, TEST_PASSWORD, 'admin')
  })

  test.afterAll(async () => {
    await deleteTestUser(userId)
    await deleteTestUser(adminId)
  })

  test('invited user can log in', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Password' }).click()
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/timer')
    // Verify timer page loaded — START button is always present
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible()
  })

  test('non-invited email is rejected', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Password' }).click()
    await page.getByLabel('Email').fill('nobody@mochi-test.dev')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('text=Invalid login credentials')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('admin can invite a new user', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Password' }).click()
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/timer')

    // Mock the invite API — no real Supabase user created, no email sent
    const inviteEmail = 'invite-mock@mochi-test.dev'
    await page.route('/api/admin/invite', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })

    await page.goto('/profile')
    await page.getByRole('button', { name: 'Admin' }).click()
    await page.getByLabel('Invite by email').fill(inviteEmail)
    await page.getByRole('button', { name: 'Send invite' }).click()
    await expect(page.getByText(new RegExp(`invite sent to ${inviteEmail}`, 'i'))).toBeVisible()
  })
})
