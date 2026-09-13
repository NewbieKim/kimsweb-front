import { expect, test } from '@playwright/test';

test('protects the habits route for signed-out visitors', async ({ page }) => {
  await page.goto('/habits');
  await expect(page).toHaveURL(/\/sign-in/);
});
