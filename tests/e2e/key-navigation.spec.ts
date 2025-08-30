import {expect, test} from '@playwright/test';

test.describe('Datetime picker - basic flows', () => {
  test('open, navigate with keys in day grid, and close', async ({page}) => {
    // Set a fixed time for the test
    // Chose a date where navigation to previous month is short, and 31st of previous month is the only visible gridcell with this number
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

    // Expect the current date to be highlighted
    const day8 = page.getByRole('gridcell', {name: /^8$/}).first();
    await expect(day8).toBeVisible();
    await expect(day8).toHaveAttribute('aria-selected', 'true');

    // Navigate with arrow keys to previous day
    const day7 = page.getByRole('gridcell', {name: /^7$/}).first();
    await expect(day7).toBeVisible();
    await expect(day7).not.toHaveAttribute('aria-selected', undefined);
    await page.keyboard.press('ArrowLeft');
    await expect(day7).toHaveAttribute('aria-selected', 'true');
    await expect(day8).not.toHaveAttribute('aria-selected', undefined);

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-07 11:55');

    // Navigate with arrow keys to previous week, i.e. 31.10.2025, which is last day of the previous month
    const day31 = page.getByRole('gridcell', {name: /^31$/}).first();
    await expect(day31).toBeVisible();
    await page.keyboard.press('ArrowUp');
    await expect(day31).toHaveAttribute('aria-selected', 'true');

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-10-31 11:55');

    // Close if it has a close button or press Escape
    await page.keyboard.press('Enter');
    await expect(grid).toBeHidden();
  });

  test('open, navigate with keys in hours, and close', async ({page}) => {
    // Set a fixed time for the test
    // Chose a time when hour is outside of visible minute steps
    await page.clock.setFixedTime(new Date('2025-11-08T12:55:30'));
    await page.goto('/demo/index.html');

    // Open the picker (adapt selectors to your demo/app)
    const input = page.getByRole('textbox').first();
    await input.click();

    // Expect widget to show up
    const grid = page.getByRole('grid');
    await expect(grid).toBeVisible();

    // Verify initial date contains correct time
    await expect(input).toHaveValue('2025-11-08 12:55');

    // Expect the current date to be focused
    const day8 = page.getByRole('gridcell', {name: /^8$/}).first();
    await expect(day8).toBeVisible();
    await expect(day8).toBeFocused();

    // Navigate with tab keys to select time
    const hour12 = page.getByRole('option', {name: /^12$/}).first();
    await expect(hour12).toBeVisible();
    await expect(hour12).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Tab');
    await expect(hour12).toBeFocused();

    // Verify input is unmodified
    await expect(input).toHaveValue('2025-11-08 12:55');

    // Decrement hour with arrow key
    const hour11 = page.getByRole('option', {name: /^11$/}).first();
    await expect(hour11).toBeVisible();
    await expect(hour11).not.toHaveAttribute('aria-current', undefined);
    await page.keyboard.press('ArrowUp');
    await expect(hour11).toHaveAttribute('aria-current', 'true');

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-08 11:55');

    // Increment hour with arrow key
    await expect(hour12).toBeVisible();
    await expect(hour12).not.toHaveAttribute('aria-current', undefined);
    await page.keyboard.press('ArrowDown');
    await expect(hour12).toHaveAttribute('aria-current', 'true');

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-08 12:55');

    // Increment hour with plus key
    const hour13 = page.getByRole('option', {name: /^13$/}).first();
    await expect(hour13).toBeVisible();
    await expect(hour13).not.toHaveAttribute('aria-current', undefined);
    await page.keyboard.press('+');
    await expect(hour13).toHaveAttribute('aria-current', 'true');

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-08 13:55');

    // Close if it has a close button or press Escape
    await page.keyboard.press('Enter');
    await expect(grid).toBeHidden();
  });

  test('open, navigate with keys in minutes, and close', async ({page}) => {
    // Set a fixed time for the test
    // Chose a time when minute is outside hours and days range
    await page.clock.setFixedTime(new Date('2025-11-08T12:55:30'));
    await page.goto('/demo/index.html');

    // Open the picker (adapt selectors to your demo/app)
    const input = page.getByRole('textbox').first();
    await input.click();

    // Expect widget to show up
    const grid = page.getByRole('grid');
    await expect(grid).toBeVisible();

    // Verify initial date contains correct time
    await expect(input).toHaveValue('2025-11-08 12:55');

    // Expect the current date to be focused
    const day8 = page.getByRole('gridcell', {name: /^8$/}).first();
    await expect(day8).toBeVisible();
    await expect(day8).toBeFocused();

    // Navigate with tab keys to select time
    const minute55 = page.getByRole('option', {name: /^55$/}).first();
    await expect(minute55).toBeVisible();
    await expect(minute55).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(minute55).toBeFocused();

    // Verify input is unmodified
    await expect(input).toHaveValue('2025-11-08 12:55');

    // Step-decrement minute with arrow key
    const minute50 = page.getByRole('option', {name: /^50$/}).first();
    await expect(minute50).toBeVisible();
    await expect(minute50).not.toHaveAttribute('aria-current', undefined);
    await page.keyboard.press('ArrowUp');
    await expect(minute50).toHaveAttribute('aria-current', 'true');

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-08 12:50');

    // Decrement minute with minus key
    const minute49 = page.getByRole('option', {name: /^49$/}).first();
    await expect(minute49).not.toBeVisible();
    await page.keyboard.press('-');
    await expect(minute49).toHaveAttribute('aria-current', 'true');

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-08 12:49');

    // Decrement minute with minus key
    const minute48 = page.getByRole('option', {name: /^48$/}).first();
    await expect(minute48).not.toBeVisible();
    await page.keyboard.press('-');
    await expect(minute48).toHaveAttribute('aria-current', 'true');
    await expect(minute49).not.toBeVisible();

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-08 12:48');

    // Step-decrement minute with arrow key
    await expect(minute50).toBeVisible();
    await expect(minute50).not.toHaveAttribute('aria-current', undefined);
    await page.keyboard.press('ArrowDown');
    await expect(minute50).toHaveAttribute('aria-current', 'true');

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-08 12:50');

    // Close if it has a close button or press Escape
    await page.keyboard.press('Enter');
    await expect(grid).toBeHidden();
  });
});
