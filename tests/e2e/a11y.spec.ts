import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Pass' })).toBeVisible();
});

test('in-game view has no WCAG 2.1 a/aa violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test('open pass dialog has no WCAG 2.1 a/aa violations', async ({ page }) => {
  await page.getByRole('button', { name: 'Pass' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Pass?' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
});
