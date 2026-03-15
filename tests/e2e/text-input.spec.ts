import {expect, test} from '@playwright/test';

test.describe('Datetime picker - text input editing', () => {
  test('open, clear text input, then close', async ({page}) => {
    // Set a fixed time for the test
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    // Open the picker (adapt selectors to your demo/app)
    const input = page.getByRole('textbox').first();
    await input.click();

    // Expect widget to show up
    const grid = page.getByRole('grid');
    await expect(grid).toBeVisible();

    // Verify initial date is 8th of the current month
    await expect(input).toHaveValue('2025-11-08 11:55');

    // Select text and delete it
    await input.selectText();
    await page.keyboard.press('Backspace');

    // Click on document to close
    await page.getByRole('heading', {name: 'Vanilla DateTime Picker'}).first().click();
    await expect(grid).toBeHidden();

    // Verify input is empty
    await expect(input).toHaveValue('');
  });

});
