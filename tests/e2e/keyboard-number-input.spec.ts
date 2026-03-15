import {expect, test} from '@playwright/test';

test.describe('Datetime picker - keyboard number input for hours and minutes', () => {
  test('typing single digit hour shows in header and updates selection', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    const grid = page.getByRole('grid');
    await expect(grid).toBeVisible();

    // Click on hour column to focus it
    const elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await elevenHourBtn.click();
    await expect(elevenHourBtn).toHaveAttribute('aria-current', 'true');

    // Type '5' to select hour 5
    await page.keyboard.press('5');

    // Verify hour header shows typed value
    const hourHeader = page.locator('[data-ref="hours-header"]');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '5');

    // Verify hour 5 is selected
    const fiveHourBtn = page.getByRole('option', {name: '05', exact: true}).first();
    await expect(fiveHourBtn).toHaveAttribute('aria-current', 'true');

    // Verify input updated
    await expect(input).toHaveValue('2025-11-08 05:55');
  });

  test('typing two digit hour shows accumulated value in header', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on hour column to focus it
    const elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await elevenHourBtn.click();

    const hourHeader = page.locator('[data-ref="hours-header"]');

    // Type '1' first
    await page.keyboard.press('1');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '1');
    const oneHourBtn = page.getByRole('option', {name: '01', exact: true}).first();
    await expect(oneHourBtn).toHaveAttribute('aria-current', 'true');
    await expect(input).toHaveValue('2025-11-08 01:55');

    // Type '7' to make it 17
    await page.keyboard.press('7');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '17');
    const seventeenHourBtn = page.getByRole('option', {name: '17', exact: true}).first();
    await expect(seventeenHourBtn).toHaveAttribute('aria-current', 'true');
    await expect(input).toHaveValue('2025-11-08 17:55');
  });

  test('typing hour > 23 resets to single digit', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on hour column to focus it
    const elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await elevenHourBtn.click();

    const hourHeader = page.locator('[data-ref="hours-header"]');

    // Type '2'
    await page.keyboard.press('2');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '2');

    // Type '5' - should reset to 5 (since 25 > 23)
    await page.keyboard.press('5');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '5');
    const fiveHourBtn = page.getByRole('option', {name: '05', exact: true}).first();
    await expect(fiveHourBtn).toHaveAttribute('aria-current', 'true');
    await expect(input).toHaveValue('2025-11-08 05:55');
  });

  test('typed hour display clears when focus leaves hour column', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on hour column to focus it
    const elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await elevenHourBtn.click();

    const hourHeader = page.locator('[data-ref="hours-header"]');

    // Type '1' and '4' to make 14
    await page.keyboard.press('1');
    await page.keyboard.press('4');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '14');

    // Tab to move to minute column
    await page.keyboard.press('Tab');

    // Verify typed display is cleared
    await expect(hourHeader).toHaveAttribute('data-typed-display', '');
  });

  test('typing single digit minute shows in header and updates selection', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on minute column to focus it
    const fiftyFiveMinuteBtn = page.getByRole('option', {name: '55', exact: true}).first();
    await fiftyFiveMinuteBtn.click();
    await expect(fiftyFiveMinuteBtn).toHaveAttribute('aria-current', 'true');

    const minuteHeader = page.locator('[data-ref="minutes-header"]');

    // Type '5' to select minute 5
    await page.keyboard.press('5');

    // Verify minute header shows typed value
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '5');

    // Verify minute 5 is selected
    const fiveMinuteBtn = page.getByRole('option', {name: '05', exact: true}).first();
    await expect(fiveMinuteBtn).toHaveAttribute('aria-current', 'true');

    // Verify input updated
    await expect(input).toHaveValue('2025-11-08 11:05');
  });

  test('typing two digit minute shows accumulated value in header', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on minute column to focus it
    const fiftyFiveMinuteBtn = page.getByRole('option', {name: '55', exact: true}).first();
    await fiftyFiveMinuteBtn.click();

    const minuteHeader = page.locator('[data-ref="minutes-header"]');

    // Type '3' first
    await page.keyboard.press('3');
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '3');
    const threeMinuteBtn = page.getByRole('option', {name: '03', exact: true}).first();
    await expect(threeMinuteBtn).toHaveAttribute('aria-current', 'true');
    await expect(input).toHaveValue('2025-11-08 11:03');

    // Type '7' to make it 37
    await page.keyboard.press('7');
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '37');
    const thirtySevenMinuteBtn = page.getByRole('option', {name: '37', exact: true}).first();
    await expect(thirtySevenMinuteBtn).toHaveAttribute('aria-current', 'true');
    await expect(input).toHaveValue('2025-11-08 11:37');
  });

  test('typing minute > 59 resets to single digit', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on minute column to focus it
    const fiftyFiveMinuteBtn = page.getByRole('option', {name: '55', exact: true}).first();
    await fiftyFiveMinuteBtn.click();

    const minuteHeader = page.locator('[data-ref="minutes-header"]');

    // Type '6'
    await page.keyboard.press('6');
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '6');

    // Type '5' - should reset to 5 (since 65 > 59)
    await page.keyboard.press('5');
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '5');
    const fiveMinuteBtn = page.getByRole('option', {name: '05', exact: true}).first();
    await expect(fiveMinuteBtn).toHaveAttribute('aria-current', 'true');
    await expect(input).toHaveValue('2025-11-08 11:05');
  });

  test('typed minute display clears when focus leaves minute column', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on minute column to focus it
    const fiftyFiveMinuteBtn = page.getByRole('option', {name: '55', exact: true}).first();
    await fiftyFiveMinuteBtn.click();

    const minuteHeader = page.locator('[data-ref="minutes-header"]');

    // Type '2' and '3' to make 23
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '23');

    // Shift+Tab to move back to hour column
    await page.keyboard.press('Shift+Tab');

    // Verify typed display is cleared
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '');
  });

  test('arrow keys clear typed input display', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on hour column to focus it
    const elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await elevenHourBtn.click();

    const hourHeader = page.locator('[data-ref="hours-header"]');

    // Type '1' and '4' to make 14
    await page.keyboard.press('1');
    await page.keyboard.press('4');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '14');

    // Press arrow key
    await page.keyboard.press('ArrowDown');

    // Verify typed display is cleared
    await expect(hourHeader).toHaveAttribute('data-typed-display', '');

    // Verify hour changed to 15
    const fifteenHourBtn = page.getByRole('option', {name: '15', exact: true}).first();
    await expect(fifteenHourBtn).toHaveAttribute('aria-current', 'true');
  });

  test('home/end keys clear typed input display', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on minute column to focus it
    const fiftyFiveMinuteBtn = page.getByRole('option', {name: '55', exact: true}).first();
    await fiftyFiveMinuteBtn.click();

    const minuteHeader = page.locator('[data-ref="minutes-header"]');

    // Type '3' and '2' to make 32
    await page.keyboard.press('3');
    await page.keyboard.press('2');
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '32');

    // Press Home key
    await page.keyboard.press('Home');

    // Verify typed display is cleared
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '');

    // Verify minute changed to 00
    const zeroMinuteBtn = page.getByRole('option', {name: '00', exact: true}).first();
    await expect(zeroMinuteBtn).toHaveAttribute('aria-current', 'true');
  });

  test('typing hours and minutes in sequence', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Focus hour column and type 14
    const elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await elevenHourBtn.click();

    await page.keyboard.press('1');
    await page.keyboard.press('4');

    const hourHeader = page.locator('[data-ref="hours-header"]');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '14');

    const fourteenHourBtn = page.getByRole('option', {name: '14', exact: true}).first();
    await expect(fourteenHourBtn).toHaveAttribute('aria-current', 'true');

    // Tab to minute column
    await page.keyboard.press('Tab');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '');

    // Type 42 for minutes
    await page.keyboard.press('4');
    await page.keyboard.press('2');

    const minuteHeader = page.locator('[data-ref="minutes-header"]');
    await expect(minuteHeader).toHaveAttribute('data-typed-display', '42');

    const fortyTwoMinuteBtn = page.getByRole('option', {name: '42', exact: true}).first();
    await expect(fortyTwoMinuteBtn).toHaveAttribute('aria-current', 'true');

    // Verify final input value
    await expect(input).toHaveValue('2025-11-08 14:42');
  });

  test('closing picker clears typed input display', async ({page}) => {
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:30'));
    await page.goto('/demo/index.html');

    const input = page.getByRole('textbox').first();
    await input.click();

    // Click on hour column and type
    const elevenHourBtn = page.getByRole('option', {name: '11', exact: true}).first();
    await elevenHourBtn.click();

    await page.keyboard.press('1');
    await page.keyboard.press('9');

    const hourHeader = page.locator('[data-ref="hours-header"]');
    await expect(hourHeader).toHaveAttribute('data-typed-display', '19');

    // Close picker by pressing Escape
    await page.keyboard.press('Escape');

    const grid = page.getByRole('grid');
    await expect(grid).toBeHidden();

    // Reopen picker
    await page.clock.setFixedTime(new Date('2025-11-08T11:55:35'));
    await input.click();
    await expect(grid).toBeVisible();

    // Verify typed display is cleared (since picker was closed)
    await expect(hourHeader).toHaveAttribute('data-typed-display', '');
  });
});
