import { test, expect } from '@playwright/test';

test.describe('Complete Checkout Flow', () => {
  test('should allow user to signup, browse, add to cart, and checkout', async ({ page }) => {
    const uniqueUsername = `testuser_${Date.now()}`;

    await page.goto('/signup');
    await page.fill('[data-testid="input-username"]', uniqueUsername);
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-signup"]');

    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('text=All Books')).toBeVisible({ timeout: 10000 });

    const firstAddToCartButton = page.locator('[data-testid^="button-add-to-cart-"]').first();
    await firstAddToCartButton.click();

    await page.waitForSelector('text=Added to cart', { timeout: 3000 });

    await page.click('[data-testid="link-cart"]');
    await page.waitForURL('/cart', { timeout: 10000 });

    const cartItems = await page.locator('[data-testid^="cart-item-"]').count();
    expect(cartItems).toBeGreaterThan(0);

    await page.click('[data-testid="button-checkout"]');
    await page.waitForURL('/checkout', { timeout: 10000 });

    await page.fill('[data-testid="input-customer-name"]', 'Test Customer');
    await page.click('[data-testid="button-place-order"]');

    await page.waitForURL('/order-confirmation', { timeout: 10000 });
    await expect(page.locator('text=Order Confirmed')).toBeVisible({ timeout: 5000 });
  });

  test('should allow user to login and complete purchase', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="input-username"]', 'testuser');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-login"]');

    await page.waitForURL('/', { timeout: 10000 });

    const addToCartButton = page.locator('[data-testid^="button-add-to-cart-"]').first();
    await addToCartButton.click();

    await page.waitForSelector('text=Added to cart', { timeout: 3000 });

    const cartLink = page.locator('[data-testid="link-cart"]');
    await cartLink.click();

    await page.waitForURL('/cart', { timeout: 10000 });

    const totalPrice = await page.locator('[data-testid="text-total-price"]');
    await expect(totalPrice).toBeVisible();

    const checkoutButton = page.locator('[data-testid="button-checkout"]');
    await checkoutButton.click();

    await page.waitForURL('/checkout', { timeout: 10000 });

    await page.fill('[data-testid="input-customer-name"]', 'John Doe');
    
    const placeOrderButton = page.locator('[data-testid="button-place-order"]');
    await placeOrderButton.click();

    await page.waitForURL('/order-confirmation', { timeout: 10000 });
    
    const confirmationMessage = page.locator('text=Order Confirmed');
    await expect(confirmationMessage).toBeVisible({ timeout: 5000 });
  });

  test('should update cart quantity and total price', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="input-username"]', 'testuser');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-login"]');

    await page.waitForURL('/', { timeout: 10000 });

    const firstBook = page.locator('[data-testid^="button-add-to-cart-"]').first();
    await firstBook.click();

    await page.waitForSelector('text=Added to cart', { timeout: 3000 });

    await page.click('[data-testid="link-cart"]');
    await page.waitForURL('/cart', { timeout: 10000 });

    const increaseQtyButton = page.locator('[data-testid^="button-increase-qty-"]').first();
    await increaseQtyButton.click();

    await page.waitForTimeout(500);

    const quantityInput = page.locator('[data-testid^="input-quantity-"]').first();
    const quantity = await quantityInput.inputValue();
    expect(parseInt(quantity)).toBeGreaterThan(1);

    const decreaseQtyButton = page.locator('[data-testid^="button-decrease-qty-"]').first();
    await decreaseQtyButton.click();

    await page.waitForTimeout(500);

    const newQuantity = await quantityInput.inputValue();
    expect(parseInt(newQuantity)).toBe(1);
  });

  test('should allow removing items from cart', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="input-username"]', 'testuser');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-login"]');

    await page.waitForURL('/', { timeout: 10000 });

    const firstBook = page.locator('[data-testid^="button-add-to-cart-"]').first();
    await firstBook.click();

    await page.waitForSelector('text=Added to cart', { timeout: 3000 });

    await page.click('[data-testid="link-cart"]');
    await page.waitForURL('/cart', { timeout: 10000 });

    const initialCount = await page.locator('[data-testid^="cart-item-"]').count();

    const removeButton = page.locator('[data-testid^="button-remove-"]').first();
    await removeButton.click();

    await page.waitForTimeout(500);

    const newCount = await page.locator('[data-testid^="cart-item-"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should show empty cart message when cart is empty', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="input-username"]', 'newuser');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-login"]');

    await page.waitForURL('/', { timeout: 10000 });

    await page.click('[data-testid="link-cart"]');
    await page.waitForURL('/cart', { timeout: 10000 });

    const emptyMessage = page.locator('text=Your cart is empty');
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });
});
