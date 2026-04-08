import {expect, test} from '@playwright/test';

test.describe('Datetime picker - basic flows', () => {
  test('open, select date, and close', async ({page}) => {
    await page.goto('/demo/index.html');

    // Open the picker (adapt selectors to your demo/app)
    const input = page.getByRole('textbox').first();
    await input.click();

    // Expect widget to show up
    const grid = page.getByRole('grid');
    await expect(grid).toBeVisible();

    // Navigate/select a date (adapt selectors)
    // select the 15th of the visible month
    await page.getByRole('gridcell', {name: /^15$/}).first().click();

    // Verify input updated with a datetime-like value with space between date and time and day of month equals 15
    await expect(input).toHaveValue(/20\d{2}-\d{2}-15 \d{2}:\d{2}/);

    // Close if it has a close button or press Escape
    await page.keyboard.press('Escape');
    await expect(grid).toBeHidden();
  });

  test('fully visible in tall padded container', async ({page}) => {
    await page.goto('/demo/index.html');

    const container = page.locator('main');
    await container.evaluate(el => el.style.setProperty('padding-bottom', '100vh'));

    // Open the picker (adapt selectors to your demo/app)
    const input = page.getByRole('textbox').first();
    await input.click();

    // Expect widget to show up
    const grid = page.getByRole('grid');
    await expect(grid).toBeVisible();

    // additional strict check: element is fully within viewport
    const vdtp = page.locator('.vdtp-pop');
    const onOpen = await vdtp.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {rect, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight};
    });
    expect(onOpen.rect.width).toBeGreaterThan(0);
    expect(onOpen.rect.height).toBeGreaterThan(0);
    expect(onOpen.rect.top).toBeGreaterThanOrEqual(0);
    expect(onOpen.rect.left).toBeGreaterThanOrEqual(0);
    expect(onOpen.rect.bottom).toBeLessThanOrEqual(onOpen.viewportHeight);
    expect(onOpen.rect.right).toBeLessThanOrEqual(onOpen.viewportWidth);

    // Navigate/select a date (adapt selectors)
    // select the 15th of the visible month
    await page.getByRole('gridcell', {name: /^15$/}).first().click();

    const onSelection = await vdtp.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {rect, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight};
    });
    expect(onSelection.rect.width).toBeGreaterThan(0);
    expect(onSelection.rect.height).toBeGreaterThan(0);
    expect(onSelection.rect.top).toBeGreaterThanOrEqual(0);
    expect(onSelection.rect.left).toBeGreaterThanOrEqual(0);
    expect(onSelection.rect.bottom).toBeLessThanOrEqual(onSelection.viewportHeight);
    expect(onSelection.rect.right).toBeLessThanOrEqual(onSelection.viewportWidth);
  });
});
