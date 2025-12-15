import {expect, test} from '@playwright/test';

test.describe('Datetime picker - mouse selection flows', () => {
  test('open, navigate with mouse and keys in day grid, hour list and minute list, then close', async ({page}) => {
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

    // Expect the current date to be highlighted
    const day8 = page.getByRole('gridcell', {name: '8', exact: true}).first();
    await expect(day8).toBeVisible();
    await expect(day8).toHaveAttribute('aria-selected', 'true');

    // Click on 4th of November
    let novFourthBtn = page.getByRole('gridcell', {name: '4', exact: true}).first();
    await expect(novFourthBtn).toBeVisible();
    await expect(novFourthBtn).not.toHaveAttribute('aria-selected', undefined);
    await novFourthBtn.click();
    await expect(novFourthBtn).toHaveAttribute('aria-selected', 'true');
    await expect(day8).not.toHaveAttribute('aria-selected', undefined);

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-04 11:55');

    // Click on 12th hour
    let twelveHourBtn = page.getByRole('option', {name: '12', exact: true}).first();
    let elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await expect(twelveHourBtn).toBeVisible();
    await expect(twelveHourBtn).not.toHaveAttribute('aria-current', undefined);
    await expect(elevenHourBtn).toHaveAttribute('aria-current', 'true');
    await twelveHourBtn.click();
    await expect(twelveHourBtn).toHaveAttribute('aria-current', 'true');
    await expect(elevenHourBtn).not.toHaveAttribute('aria-current', undefined);

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-04 12:55');

    // Navigate to 13th hour by key
    let thirteenHourBtn = page.getByRole('option', {name: '13', exact: true}).first();
    await expect(thirteenHourBtn).toBeVisible();
    await expect(thirteenHourBtn).not.toHaveAttribute('aria-current', undefined);
    await page.keyboard.press('ArrowDown');
    await expect(thirteenHourBtn).toHaveAttribute('aria-current', 'true');
    await expect(twelveHourBtn).not.toHaveAttribute('aria-current', undefined);

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-04 13:55');

    // Click on 50th minute
    let fiftyMinuteBtn = page.getByRole('option', {name: '50', exact: true}).first();
    let fiftyFifthMinuteBtn = page.getByRole('option', {name: '55', exact: true}).first();
    await expect(fiftyMinuteBtn).toBeVisible();
    await expect(fiftyMinuteBtn).not.toHaveAttribute('aria-current', undefined);
    await expect(fiftyFifthMinuteBtn).toHaveAttribute('aria-current', 'true');
    await fiftyMinuteBtn.click();
    await expect(fiftyMinuteBtn).toHaveAttribute('aria-current', 'true');
    await expect(fiftyFifthMinuteBtn).not.toHaveAttribute('aria-current', undefined);

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-04 13:50');

    // Navigate to 45th minute by key
    let fortyFifthMinuteBtn = page.getByRole('option', {name: '45', exact: true}).first();
    await expect(fortyFifthMinuteBtn).toBeVisible();
    await expect(fortyFifthMinuteBtn).not.toHaveAttribute('aria-current', undefined);
    await page.keyboard.press('ArrowUp');
    await expect(fortyFifthMinuteBtn).toHaveAttribute('aria-current', 'true');
    await expect(fiftyMinuteBtn).not.toHaveAttribute('aria-current', undefined);

    // Verify input updated successfully
    await expect(input).toHaveValue('2025-11-04 13:45');

    // Click on document to close
    await page.getByRole('heading', {name: 'Vanilla DateTime Picker'}).first().click();
    await expect(grid).toBeHidden();
  });

});
