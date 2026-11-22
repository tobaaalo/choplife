import type { Browser, BrowserContext, Page } from '@playwright/test'

export const VIEWPORTS = [
  { w: 375, h: 812 },
  { w: 768, h: 1024 },
  { w: 1440, h: 900 },
] as const

/** Takes a screenshot at phone, tablet and desktop widths, then restores the original size. */
export async function shots(page: Page, name: string): Promise<void> {
  const original = page.viewportSize()
  for (const v of VIEWPORTS) {
    await page.setViewportSize({ width: v.w, height: v.h })
    await page.waitForTimeout(150)
    await page.screenshot({ path: `docs/screens/${name}-${v.w}.png`, fullPage: true })
  }
  if (original) await page.setViewportSize(original)
}

export async function newUser(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  return { ctx, page }
}

export async function signUp(
  page: Page,
  o: { name: string; email: string; password?: string; code?: string },
): Promise<void> {
  await page.goto('/')
  await page
    .getByRole('link', { name: o.code ? 'I have an invite code' : 'Create an account' })
    .click()
  await page.getByLabel('Your name').fill(o.name)
  await page.getByLabel('Email').fill(o.email)
  await page.getByLabel('Password').fill(o.password ?? 'password123')
  if (o.code) await page.getByLabel('Invite code').fill(o.code)
  await page.getByRole('button', { name: o.code ? 'Join household' : 'Create account' }).click()
}

export async function setup(
  page: Page,
  o: {
    sex: 'Female' | 'Male'
    year: string
    height: string
    weight: string
    goal: string
    programme?: string
  },
): Promise<void> {
  await page.getByRole('heading', { name: 'About you' }).waitFor()
  await page.getByRole('button', { name: o.sex, exact: true }).click()
  await page.getByLabel('Birth year').fill(o.year)
  await page.getByLabel('Height (cm)').fill(o.height)
  await page.getByLabel('Weight (kg)').fill(o.weight)
  await page.getByRole('button', { name: o.goal }).click()
  if (o.programme) await page.getByLabel(/On a programme/).fill(o.programme)
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('heading', { name: 'Your meals' }).waitFor()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('heading', { name: 'What you avoid' }).waitFor()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByRole('heading', { name: /^Hi / }).waitFor()
}

/** Types calories into the first n fill-in rows. */
export async function fillCalories(page: Page, n: number, kcal = 650): Promise<void> {
  await page.goto('/recipes?fill=1')
  for (let i = 0; i < n; i++) {
    const input = page.getByPlaceholder('kcal').first()
    await input.fill(String(kcal + i * 20))
    await input.press('Enter')
    await page.waitForTimeout(40)
  }
}
