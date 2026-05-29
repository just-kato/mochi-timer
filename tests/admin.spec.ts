import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
} from './fixtures/helpers'

const ADMIN_EMAIL = 'test-admin-panel@mochi-test.dev'
const USER_EMAIL = 'test-admin-user@mochi-test.dev'
const PASSWORD = 'testpassword123!'

test.describe('Admin panel', () => {
  let adminId: string
  let userId: string

  test.beforeAll(async () => {
    adminId = await createTestUser(ADMIN_EMAIL, PASSWORD, 'admin')
    userId = await createTestUser(USER_EMAIL, PASSWORD, 'user')
  })

  test.afterAll(async () => {
    await deleteTestUser(adminId)
    // userId may have been deleted in a test — catch
    await deleteTestUser(userId).catch(() => {})
  })

  test('admin can view user list', async ({ page }) => {
    await signInAsUser(page, ADMIN_EMAIL, PASSWORD)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Admin' }).click()
    await expect(page.locator(`text=${USER_EMAIL}`)).toBeVisible()
  })

  test('admin can invite user', async ({ page }) => {
    await signInAsUser(page, ADMIN_EMAIL, PASSWORD)

    // Mock the invite API — no real Supabase user created, no email sent
    const inviteEmail = 'invite-admin-mock@mochi-test.dev'
    await page.route('/api/admin/invite', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })

    await page.goto('/profile')
    await page.getByRole('button', { name: 'Admin' }).click()
    await page.getByLabel('Invite by email').fill(inviteEmail)
    await page.getByRole('button', { name: 'Send invite' }).click()
    await expect(page.locator(`text=Invite sent to ${inviteEmail}`)).toBeVisible()
  })

  test('admin can revoke user access', async ({ page }) => {
    await signInAsUser(page, ADMIN_EMAIL, PASSWORD)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Admin' }).click()

    await expect(page.locator(`text=${USER_EMAIL}`)).toBeVisible()

    // Mock the revoke API — avoids deleting the shared test user needed by other tests
    await page.route(`/api/admin/revoke/${userId}`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })

    const revokeButton = page.locator(`xpath=//p[text()="${USER_EMAIL}"]/../../button`)
    page.once('dialog', (dialog) => dialog.accept())
    await revokeButton.click()

    // User row disappears from UI (client-side state update)
    await expect(page.locator(`text=${USER_EMAIL}`)).not.toBeVisible({ timeout: 5000 })
  })

  test('regular user cannot access admin panel', async ({ page }) => {
    await signInAsUser(page, USER_EMAIL, PASSWORD)
    await page.goto('/profile')
    // Admin tab should not be visible for regular users
    await expect(page.getByRole('button', { name: 'Admin' })).not.toBeVisible()
  })
})
