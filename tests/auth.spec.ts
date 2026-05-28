import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser, getServiceClient } from './fixtures/helpers'

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
    await expect(page.getByRole('heading', { name: 'Timer' })).toBeVisible()
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
    // Sign in as admin
    await page.goto('/login')
    await page.getByRole('button', { name: 'Password' }).click()
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/timer')

    // Navigate to admin and invite
    const inviteEmail = `invite-${Date.now()}@mochi-test.dev`
    await page.goto('/admin')
    await page.getByLabel('Invite by email').fill(inviteEmail)
    await page.getByRole('button', { name: 'Send invite' }).click()
    await expect(page.getByText(new RegExp(`invite sent to ${inviteEmail}`, 'i'))).toBeVisible()

    // Cleanup: delete the newly invited user from Supabase
    const supabase = getServiceClient()
    const { data } = await supabase.auth.admin.listUsers()
    const newUser = data.users.find((u) => u.email === inviteEmail)
    if (newUser) await supabase.auth.admin.deleteUser(newUser.id)
  })
})
