import { test, expect } from '@playwright/test';

test.describe('Real-time Book Updates', () => {
  test('should show new book instantly across multiple clients', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const customerContext = await browser.newContext();
    
    const adminPage = await adminContext.newPage();
    const customerPage = await customerContext.newPage();

    await adminPage.goto('/admin/login');
    await adminPage.fill('[data-testid="input-username"]', 'admin');
    await adminPage.fill('[data-testid="input-password"]', 'admin123');
    await adminPage.click('[data-testid="button-login"]');
    
    await adminPage.waitForURL('/admin/dashboard', { timeout: 10000 });

    await customerPage.goto('/');
    
    await customerPage.waitForSelector('[data-testid="connection-status"]', { timeout: 10000 });
    
    const connectionStatus = await customerPage.textContent('[data-testid="connection-status"]');
    expect(connectionStatus).toContain('Live');

    await adminPage.goto('/admin/books');

    await adminPage.click('[data-testid="button-add-book"]');
    await adminPage.fill('[data-testid="input-title"]', 'E2E Test Book');
    await adminPage.fill('[data-testid="input-author"]', 'Playwright Author');
    await adminPage.fill('[data-testid="input-genre"]', 'Testing');
    await adminPage.fill('[data-testid="input-year"]', '2024');
    await adminPage.fill('[data-testid="input-price"]', '899');
    await adminPage.fill('[data-testid="input-isbn"]', '1111111111');
    await adminPage.fill('[data-testid="input-stock"]', '25');
    await adminPage.click('[data-testid="button-submit"]');

    await customerPage.waitForSelector('text=Catalog Updated', { timeout: 3000 });

    const bookTitle = await customerPage.locator('text=E2E Test Book').first();
    await expect(bookTitle).toBeVisible({ timeout: 5000 });

    await adminContext.close();
    await customerContext.close();
  });

  test('should update book price across clients in real-time', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const customerContext = await browser.newContext();
    
    const adminPage = await adminContext.newPage();
    const customerPage = await customerContext.newPage();

    await adminPage.goto('/admin/login');
    await adminPage.fill('[data-testid="input-username"]', 'admin');
    await adminPage.fill('[data-testid="input-password"]', 'admin123');
    await adminPage.click('[data-testid="button-login"]');
    
    await customerPage.goto('/');

    await adminPage.goto('/admin/books');
    
    const firstEditButton = adminPage.locator('[data-testid^="button-edit-"]').first();
    await firstEditButton.click();
    
    await adminPage.fill('[data-testid="input-price"]', '1299');
    await adminPage.click('[data-testid="button-submit"]');

    await customerPage.waitForSelector('text=Book Updated', { timeout: 3000 });

    await adminContext.close();
    await customerContext.close();
  });

  test('should show book deletion across clients', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const customerContext = await browser.newContext();
    
    const adminPage = await adminContext.newPage();
    const customerPage = await customerContext.newPage();

    await adminPage.goto('/admin/login');
    await adminPage.fill('[data-testid="input-username"]', 'admin');
    await adminPage.fill('[data-testid="input-password"]', 'admin123');
    await adminPage.click('[data-testid="button-login"]');
    
    await customerPage.goto('/');

    await adminPage.goto('/admin/books');

    await adminPage.click('[data-testid="button-add-book"]');
    await adminPage.fill('[data-testid="input-title"]', 'Book to Delete E2E');
    await adminPage.fill('[data-testid="input-author"]', 'Delete Author');
    await adminPage.fill('[data-testid="input-genre"]', 'Testing');
    await adminPage.fill('[data-testid="input-year"]', '2024');
    await adminPage.fill('[data-testid="input-price"]', '599');
    await adminPage.fill('[data-testid="input-isbn"]', '2222222222');
    await adminPage.fill('[data-testid="input-stock"]', '15');
    await adminPage.click('[data-testid="button-submit"]');

    await customerPage.waitForSelector('text=Book to Delete E2E', { timeout: 5000 });

    await adminPage.locator('text=Book to Delete E2E').first().waitFor();
    const deleteButton = adminPage.locator('[data-testid^="button-delete-"]').last();
    await deleteButton.click();

    await adminPage.click('[data-testid="button-confirm-delete"]');

    await customerPage.waitForSelector('text=Book Removed', { timeout: 3000 });

    await adminContext.close();
    await customerContext.close();
  });
});
