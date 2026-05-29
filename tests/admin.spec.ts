import { test, expect } from '@playwright/test'
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  getServiceClient,
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
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Admin' }).click()

    const inviteEmail = `invite-admin-test-${Date.now()}@mochi-test.dev`
    await page.getByLabel('Invite by email').fill(inviteEmail)
    await page.getByRole('button', { name: 'Send invite' }).click()
    await expect(page.locator(`text=Invite sent to ${inviteEmail}`)).toBeVisible()

    // Cleanup
    const supabase = getServiceClient()
    const { data } = await supabase.auth.admin.listUsers()
    const u = data.users.find((x) => x.email === inviteEmail)
    if (u) await supabase.auth.admin.deleteUser(u.id)
  })

  test('admin can revoke user access', async ({ page }) => {
    // Create a disposable user to revoke
    const revokeEmail = `revoke-test-${Date.now()}@mochi-test.dev`
    const revokeId = await createTestUser(revokeEmail, PASSWORD, 'user')

    await signInAsUser(page, ADMIN_EMAIL, PASSWORD)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Admin' }).click()

    await expect(page.locator(`text=${revokeEmail}`)).toBeVisible()

    // Navigate from the email <p> up to its grandparent row div, then to the sibling REVOKE button
    const revokeButton = page.locator(`xpath=//p[text()="${revokeEmail}"]/../../button`)
    page.once('dialog', (dialog) => dialog.accept())
    await revokeButton.click()

    // User row disappears from list
    await expect(page.locator(`text=${revokeEmail}`)).not.toBeVisible({ timeout: 5000 })

    // Verify Supabase user is gone
    const supabase = getServiceClient()
    const { data } = await supabase.auth.admin.getUserById(revokeId)
    expect(data.user).toBeNull()
  })

  test('regular user cannot access admin panel', async ({ page }) => {
    await signInAsUser(page, USER_EMAIL, PASSWORD)
    await page.goto('/profile')
    // Admin tab should not be visible for regular users
    await expect(page.getByRole('button', { name: 'Admin' })).not.toBeVisible()
  })
})
