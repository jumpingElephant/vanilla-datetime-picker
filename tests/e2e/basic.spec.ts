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
});
