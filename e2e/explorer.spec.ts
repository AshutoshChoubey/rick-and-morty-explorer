import { test, expect } from '@playwright/test';

test.describe('Rick & Morty Character Explorer E2E Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('rm_simulated_user_role', 'ADMIN');
    });
    await page.reload();
    
    const gridBtn = page.locator('mat-button-toggle[value="grid"] button');
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
    }
  });

  test('Requirement 1: Home Page Characters List, Grid & List View Toggle, and Character Metadata', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Character Explorer');

    const cards = page.locator('mat-card.group');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = cards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('img')).toBeVisible();
    await expect(firstCard.locator('span:text-matches("Alive|Dead|unknown", "i")').first()).toBeVisible();
    await expect(firstCard.locator('text=/\\d+\\s+eps?/')).toBeVisible();

    // Toggle to List View
    const listViewButton = page.locator('mat-button-toggle[value="list"] button');
    await listViewButton.click();

    // Verify Angular Material Table renders
    const table = page.locator('table[mat-table]');
    await expect(table).toBeVisible();
    await expect(table.locator('th:has-text("Avatar")')).toBeVisible();
    await expect(table.locator('th:has-text("Name")')).toBeVisible();
    await expect(table.locator('th:has-text("Status")')).toBeVisible();
    await expect(table.locator('th:has-text("Species")')).toBeVisible();
    await expect(table.locator('th:has-text("Gender")')).toBeVisible();
    await expect(table.locator('th:has-text("Episodes")')).toBeVisible();
    await expect(table.locator('th:has-text("Action")')).toBeVisible();

    const rows = page.locator('tr[mat-row]');
    expect(await rows.count()).toBeGreaterThan(0);

    // Toggle back to Grid View
    const gridViewButton = page.locator('mat-button-toggle[value="grid"] button');
    await gridViewButton.click();
    await expect(page.locator('mat-card.group').first()).toBeVisible();
  });

  test('Requirement 1: Global Character Search with RxJS Debouncing and Reset', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search characters"]');
    await expect(searchInput).toBeVisible();

    // Type "Morty" and verify debounced search results
    await searchInput.fill('Morty');
    await expect(page.locator('mat-card.group').first().locator('h3')).toContainText(/Morty/i, { timeout: 15000 });

    // Search for a non-existent name
    await searchInput.fill('xyznonexistentchar999');
    await expect(page.locator('text=No Characters Found')).toBeVisible({ timeout: 15000 });

    // Click "Clear Search Filter" button
    const clearButton = page.locator('button:has-text("Clear Search Filter")');
    await clearButton.click();

    await expect(page.locator('mat-card.group').first()).toBeVisible({ timeout: 15000 });
  });

  test('Requirement 2: Character Details Navigation, Metadata, and Episode Table', async ({ page }) => {
    // Select first character
    const firstCard = page.locator('mat-card.group').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const characterName = await firstCard.locator('h3').textContent();
    await firstCard.click();

    // Verify URL route navigation to /character/:id
    await page.waitForURL(/\/character\/\d+/, { timeout: 15000 });

    // Verify Character Detail profile card
    await expect(page.locator('h1')).toContainText(characterName?.trim() || '', { timeout: 15000 });
    await expect(page.locator('text=Total Episodes')).toBeVisible();
    await expect(page.locator('text=Origin Location')).toBeVisible();
    await expect(page.locator('text=Last Known Place')).toBeVisible();

    // Verify Episode Appearances table headers (strictly: name, air_date, episode)
    const episodeTable = page.locator('table[mat-table]');
    await expect(episodeTable).toBeVisible({ timeout: 20000 });
    await expect(episodeTable.locator('th button:has-text("name")')).toBeVisible();
    await expect(episodeTable.locator('th button:has-text("air_date")')).toBeVisible();
    await expect(episodeTable.locator('th button:has-text("episode")')).toBeVisible();

    const episodeRows = episodeTable.locator('tr[mat-row]');
    expect(await episodeRows.count()).toBeGreaterThan(0);
  });

  test('Requirement 2: Client-Side Free Form Search on Episode Name & Column Sorting', async ({ page }) => {
    await page.goto('/character/1');
    await page.waitForURL('/character/1', { timeout: 15000 });

    const episodeTable = page.locator('table[mat-table]');
    await expect(episodeTable).toBeVisible({ timeout: 20000 });
    const initialCount = await episodeTable.locator('tr[mat-row]').count();
    expect(initialCount).toBeGreaterThan(1);

    // Filter by episode name "Lawnmower"
    const filterInput = page.locator('input[placeholder="Filter by episode name..."]');
    await filterInput.fill('Lawnmower');

    // toHaveCount automatically retries until RxJS debounce passes and table updates
    await expect(episodeTable.locator('tr[mat-row]')).toHaveCount(1, { timeout: 10000 });
    await expect(episodeTable.locator('tr[mat-row]').first()).toContainText('Lawnmower');

    // Clear filter
    const clearFilterBtn = page.locator('button[title="Clear filter"]');
    await clearFilterBtn.click();

    await expect(episodeTable.locator('tr[mat-row]')).toHaveCount(initialCount, { timeout: 10000 });

    // Column sorting by name
    const nameSortBtn = episodeTable.locator('th button:has-text("name")');
    await nameSortBtn.click();
    await page.waitForTimeout(300);

    const firstRowText = await episodeTable.locator('tr[mat-row]').first().textContent();
    expect(firstRowText).toBeTruthy();
  });

  test('Requirement 3: Role-Based Authorization - Viewer Restricted from Character Details with 403 Notice', async ({ page }) => {
    // Switch role to Viewer
    const viewerRoleBtn = page.locator('button:has-text("Viewer")');
    await viewerRoleBtn.click();
    await page.waitForTimeout(200);

    // Verify indicator changes to "List Only"
    await expect(page.locator('text=List Only')).toBeVisible();

    // Click on a character
    const firstCard = page.locator('mat-card.group').first();
    await firstCard.click();

    // Verify redirected to /access-denied
    await page.waitForURL(/\/access-denied/);
    await expect(page.locator('h1')).toContainText('Access Restricted');
    await expect(page.locator('text=HTTP 403 • ACCESS FORBIDDEN')).toBeVisible();
    await expect(page.locator('text=Restricted Route Attempted:')).toBeVisible();

    // Click "Switch to Admin & Unlock"
    const unlockBtn = page.locator('button:has-text("Switch to Admin & Unlock")');
    await unlockBtn.click();

    // Verify user is promoted to Admin and routed to the character details
    await page.waitForURL(/\/character\/\d+/);
    await expect(page.locator('text=Episode Appearances')).toBeVisible();
  });

  test('Requirement 3: Route Guard directly blocks Viewer accessing /character/:id via URL', async ({ page }) => {
    // Set role to Viewer in storage and visit /character/2 directly
    await page.evaluate(() => localStorage.setItem('rm_simulated_user_role', 'VIEWER'));
    await page.goto('/character/2');

    // Verify roleGuard intercepts and redirects to /access-denied
    await page.waitForURL(/\/access-denied\?attempted=%2Fcharacter%2F2/);
    await expect(page.locator('h1')).toContainText('Access Restricted');
    await expect(page.locator('code:has-text("/character/2")')).toBeVisible();
  });

  test('Requirement 1 (Optional): State Preservation Between Navigation', async ({ page }) => {
    // Search for "Smith"
    const searchInput = page.locator('input[placeholder*="Search characters"]');
    await searchInput.fill('Smith');
    await expect(page.locator('mat-card.group').first().locator('h3')).toContainText(/Smith/i, { timeout: 15000 });

    // Switch to List View
    const listViewButton = page.locator('mat-button-toggle[value="list"] button');
    await listViewButton.click();

    // Select first character in list
    const row = page.locator('tr[mat-row]').first();
    await row.click();
    await page.waitForURL(/\/character\/\d+/);

    // Click "Back to Character Directory"
    const backBtn = page.locator('a:has-text("Back to Character Directory")');
    await backBtn.click();
    await page.waitForURL('/');

    // Verify search term is preserved
    await expect(searchInput).toHaveValue('Smith');

    // Verify list view toggle is preserved
    await expect(page.locator('table[mat-table]')).toBeVisible();
  });

});

