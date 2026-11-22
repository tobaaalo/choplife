import { expect, test } from '@playwright/test'
import { fillCalories, newUser, setup, shots, signUp } from './helpers'

const stamp = Date.now()

test('two households, full journey', async ({ browser }) => {
  test.setTimeout(240_000)

  // ---------- Toba creates household A ----------
  const a = await newUser(browser)
  const toba = a.page
  await toba.goto('/')
  await expect(toba.getByRole('heading', { name: 'Choplife' })).toBeVisible()
  await shots(toba, '01-welcome')
  await toba.getByRole('link', { name: 'Create an account' }).click()
  await shots(toba, '02-signup')

  // validation message
  await toba.getByLabel('Your name').fill('Toba')
  await toba.getByLabel('Email').fill('nope')
  await toba.getByLabel('Password').fill('password123')
  await toba.getByRole('button', { name: 'Create account' }).click()
  await expect(toba.getByRole('alert')).toContainText('valid email')

  await toba.getByLabel('Email').fill(`toba${stamp}@example.com`)
  await toba.getByRole('button', { name: 'Create account' }).click()
  await expect(toba.getByRole('heading', { name: 'About you' })).toBeVisible()
  await shots(toba, '03-setup-1')
  await setup(toba, { sex: 'Male', year: '1988', height: '181', weight: '86', goal: 'Gain weight' })

  // empty state: no calories yet
  await expect(
    toba.getByRole('heading', { name: 'First, add calories to your dishes' }),
  ).toBeVisible()
  await shots(toba, '04-today-empty')

  // fill calories
  await fillCalories(toba, 14)
  await shots(toba, '05-fill-calories')

  // own dish with ingredients
  await toba.goto('/recipes/new')
  await toba.getByLabel('Name').fill('Secret stew')
  await toba.getByLabel('Calories (kcal)').fill('700')
  await toba.getByRole('button', { name: 'Add ingredient' }).click()
  await toba.getByLabel('Ingredient 1').fill('Rice')
  await toba.getByLabel('Amount').fill('100')
  await toba.getByRole('button', { name: 'Save dish' }).click()
  await expect(toba.getByText('Secret stew')).toBeVisible()
  await shots(toba, '06-recipes')

  // invite code
  await toba.goto('/settings')
  const code = (
    await toba
      .locator('p', { hasText: /^[A-Z2-9]{6}$/ })
      .first()
      .innerText()
  ).trim()
  expect(code).toMatch(/^[A-Z2-9]{6}$/)
  await shots(toba, '07-settings')

  // ---------- wife joins ----------
  const b = await newUser(browser)
  const wife = b.page
  await signUp(wife, { name: 'Wife', email: `wife${stamp}@example.com`, code })
  await setup(wife, {
    sex: 'Female',
    year: '1990',
    height: '165',
    weight: '78',
    goal: 'Lose weight',
    programme: '1500',
  })

  // ---------- plan the week as Toba ----------
  await toba.goto('/week')
  await toba.getByRole('button', { name: 'Plan the week' }).click()
  await expect(toba.getByText(/Planned \d+ meal/)).toBeVisible()
  await shots(toba, '08-week')

  // Today shows two portion stubs with different sizes
  await toba.goto('/today')
  await toba.getByRole('button', { name: 'Choose my meals' }).click()
  const stubs = toba.locator('.stub')
  await expect(stubs.first()).toBeVisible()
  expect(await stubs.count()).toBeGreaterThanOrEqual(2)
  await shots(toba, '09-today-planned')

  // mark eaten, then undo
  await toba.getByRole('button', { name: 'We ate it' }).first().click()
  await expect(toba.locator('.stamp').first()).toBeVisible()
  await shots(toba, '10-today-eaten')
  await toba.getByRole('button', { name: 'Undo' }).click()
  await expect(toba.locator('.stamp')).toHaveCount(0)

  // recommender with mood chips
  await toba.getByRole('button', { name: 'More' }).first().click()
  await toba.getByRole('button', { name: 'Pick something else' }).click()
  await toba.getByRole('button', { name: 'Spicy' }).click()
  await expect(toba.getByRole('button', { name: 'Cook this' }).first()).toBeVisible()
  await shots(toba, '11-recommender')
  await toba.getByRole('button', { name: 'Not this' }).first().click()
  await expect(toba.getByText(/hidden for 14 days/)).toBeVisible()
  await toba.getByRole('button', { name: 'Cook this' }).first().click()

  // kitchen and cook-now
  await toba.goto('/kitchen')
  await toba.getByLabel('Add something').fill('Rice')
  await toba.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(toba.getByRole('list', { name: 'Kitchen items' })).toContainText('Rice')
  await expect(toba.getByRole('heading', { name: 'Secret stew' })).toBeVisible()
  await shots(toba, '12-kitchen')

  // shopping list: wife sees the same plan
  await wife.goto('/list')
  await expect(wife.getByRole('heading', { name: 'Shopping list' })).toBeVisible()
  await shots(wife, '13-list')
  await wife.goto('/today')
  await expect(wife.locator('.stub').first()).toBeVisible()

  // wife sees the dish Toba made (shared household)
  await wife.goto('/recipes')
  await expect(wife.getByText('Secret stew')).toBeVisible()

  // per-person ticket: only Toba ate the lunch
  await toba.goto('/today')
  const lunch = toba.getByRole('region', { name: 'Lunch' })
  await lunch.getByRole('button', { name: /Toba/ }).click()
  await expect(lunch.getByRole('button', { name: /Toba/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(lunch.getByRole('button', { name: /Wife/ })).toHaveAttribute('aria-pressed', 'false')
  await expect(lunch.locator('.stamp')).toHaveCount(0)
  await lunch.getByRole('button', { name: /Wife/ }).click()
  await expect(lunch.locator('.stamp')).toBeVisible()

  // cook view shows real steps for a starter dish
  await toba
    .getByRole('region', { name: 'Dinner' })
    .getByRole('button', { name: 'How to cook it' })
    .click()
  await expect(toba.getByText('Method')).toBeVisible()
  await expect(toba.getByText(/^1\. /).first()).toBeVisible()
  await shots(toba, '15-cook-view')
  await toba.keyboard.press('Escape')

  // ate something else on breakfast
  const breakfast = toba.getByRole('region', { name: 'Breakfast' })
  if (await breakfast.getByRole('button', { name: 'We ate something else' }).count()) {
    await breakfast.getByRole('button', { name: 'We ate something else' }).click()
  } else {
    await breakfast.getByRole('button', { name: 'More' }).click()
    await toba.getByRole('button', { name: 'We ate something else' }).click()
  }
  await toba.getByLabel('What was it?').fill('Takeaway pizza')
  await toba.getByLabel('Roughly how many calories?').fill('800')
  await shots(toba, '16-ate-something-else')
  await toba.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(toba.getByRole('heading', { name: 'Takeaway pizza' })).toBeVisible()

  // quick-add in kitchen and shopping list now has real items
  await toba.goto('/kitchen')
  await toba.getByRole('button', { name: '+ Garri' }).click()
  await expect(toba.getByRole('list', { name: 'Kitchen items' })).toContainText('Garri')
  await toba.goto('/list')
  await expect(toba.getByRole('button', { name: /Share or copy/ })).toBeVisible()
  await shots(toba, '17-list-with-items')

  // allergy: wife is allergic to eggs, no egg dish is suggested
  await wife.goto('/setup')
  await wife.getByRole('button', { name: 'Next' }).click()
  await wife.getByRole('button', { name: 'Next' }).click()
  await wife.getByRole('button', { name: 'Eggs' }).click()
  await wife.getByRole('button', { name: 'Finish' }).click()
  await wife.goto('/today')
  await wife
    .getByRole('button', { name: /What do you feel like|More/ })
    .first()
    .click()
  const names = await wife.locator('dialog h3').allInnerTexts()
  for (const n of names) expect(n.toLowerCase()).not.toMatch(/\begg/)

  // dark theme: toggle, persists across reload, readable
  await toba.goto('/today')
  await toba.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(toba.locator('html')).toHaveAttribute('data-theme', 'dark')
  await toba.reload()
  await expect(toba.locator('html')).toHaveAttribute('data-theme', 'dark')
  await shots(toba, '18-dark-today')
  await toba.goto('/settings')
  await shots(toba, '19-dark-settings')
  await toba.getByRole('button', { name: 'Light', exact: true }).click()
  await expect(toba.locator('html')).toHaveAttribute('data-theme', 'light')

  // ---------- household B is separate ----------
  const c = await newUser(browser)
  const other = c.page
  await signUp(other, { name: 'Other', email: `other${stamp}@example.com` })
  await setup(other, {
    sex: 'Female',
    year: '1985',
    height: '170',
    weight: '70',
    goal: 'Stay the same',
  })
  await other.goto('/recipes')
  await expect(other.getByText('Secret stew')).toHaveCount(0)
  await other.goto('/kitchen')
  await expect(other.getByText('Your kitchen is empty')).toBeVisible()

  // ---------- offline queue ----------
  await toba.goto('/kitchen')
  await a.ctx.setOffline(true)
  await toba.getByLabel('Add something').fill('Palm oil')
  await toba.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(toba.getByRole('list', { name: 'Kitchen items' })).toContainText('Palm oil')
  await expect(toba.getByText(/Offline|Saving/)).toBeVisible()
  await a.ctx.setOffline(false)
  await toba.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(toba.getByText(/Offline|Saving/)).toHaveCount(0, { timeout: 15_000 })
  await wife.goto('/kitchen')
  await expect(wife.getByRole('list', { name: 'Kitchen items' })).toContainText('Palm oil')

  await shots(toba, '14-account-settings')
  await a.ctx.close()
  await b.ctx.close()
  await c.ctx.close()
})
