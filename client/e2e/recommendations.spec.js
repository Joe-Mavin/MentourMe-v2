const { test, expect } = require('@playwright/test');

test.describe('Recommendations and Mentorship Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('view recommended mentors on dashboard', async ({ page }) => {
    // Should see recommendations section
    await expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Recommended Mentors');

    // Should have mentor cards
    const mentorCards = page.locator('[data-testid="mentor-card"]');
    await expect(mentorCards).toHaveCount(1, { timeout: 10000 });

    // Check mentor card content
    const firstCard = mentorCards.first();
    await expect(firstCard.locator('[data-testid="mentor-name"]')).toContainText('Test Mentor');
    await expect(firstCard.locator('[data-testid="compatibility-score"]')).toContainText('8.5');
    await expect(firstCard.locator('[data-testid="matching-factors"]')).toContainText('Similar goals');
  });

  test('send mentorship request successfully', async ({ page }) => {
    // Wait for recommendations to load
    await expect(page.locator('[data-testid="mentor-card"]')).toBeVisible();

    // Click request mentorship button
    await page.click('[data-testid="request-mentorship-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Mentorship request sent successfully!');

    // Button should be disabled or changed
    await expect(page.locator('[data-testid="request-mentorship-button"]')).toBeDisabled();
  });

  test('handle mentorship request errors', async ({ page }) => {
    // Mock error response
    await page.route('/api/recommendations/request', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'You already have a pending request with this mentor'
        })
      });
    });

    await expect(page.locator('[data-testid="mentor-card"]')).toBeVisible();
    await page.click('[data-testid="request-mentorship-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('You already have a pending request with this mentor');
  });

  test('navigate to mentor profile', async ({ page }) => {
    await expect(page.locator('[data-testid="mentor-card"]')).toBeVisible();

    // Click view profile button
    await page.click('[data-testid="view-profile-button"]');

    // Should navigate to mentor profile
    await expect(page).toHaveURL(/\/mentors\/\d+/);
    await expect(page.locator('h1')).toContainText('Test Mentor');
  });

  test('start conversation with mentor', async ({ page }) => {
    await expect(page.locator('[data-testid="mentor-card"]')).toBeVisible();

    // Click message button
    await page.click('[data-testid="message-mentor-button"]');

    // Should navigate to messages
    await expect(page).toHaveURL(/\/messages/);
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
  });

  test('filter recommendations', async ({ page }) => {
    // Click filter button
    await page.click('[data-testid="filter-button"]');

    // Should show filter options
    await expect(page.locator('[data-testid="filter-modal"]')).toBeVisible();

    // Apply location filter
    await page.selectOption('[data-testid="location-filter"]', 'New York');
    await page.click('[data-testid="apply-filters-button"]');

    // Should update recommendations
    await expect(page.locator('[data-testid="mentor-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('New York');
  });

  test('sort recommendations', async ({ page }) => {
    // Click sort dropdown
    await page.click('[data-testid="sort-dropdown"]');

    // Select sort by rating
    await page.click('[data-testid="sort-rating"]');

    // Should update order
    await expect(page.locator('[data-testid="mentor-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-sort"]')).toContainText('Rating');
  });

  test('pagination works correctly', async ({ page }) => {
    // Mock multiple pages of results
    await page.route('/api/recommendations*', route => {
      const url = new URL(route.request().url());
      const page_num = url.searchParams.get('page') || '1';
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            recommendations: Array(5).fill().map((_, i) => ({
              user: {
                id: i + 1,
                name: `Mentor ${i + 1}`,
                role: 'mentor',
                bio: 'Test mentor'
              },
              compatibilityScore: 8.0 + i * 0.1,
              matchingFactors: ['Similar goals'],
              explanation: 'Great match!'
            })),
            pagination: {
              page: parseInt(page_num),
              totalPages: 3,
              total: 15
            }
          }
        })
      });
    });

    await page.reload();
    
    // Should show pagination
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Click next page
    await page.click('[data-testid="next-page"]');
    
    // Should load page 2
    await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
  });
});
