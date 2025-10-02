const { test, expect } = require('@playwright/test');

test.describe('Real-time Messaging', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigate to messages page', async ({ page }) => {
    // Click messages in navigation
    await page.click('[data-testid="nav-messages"]');
    
    // Should be on messages page
    await expect(page).toHaveURL('/messages');
    await expect(page.locator('h1')).toContainText('Messages');
    
    // Should show conversation list and empty chat window
    await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-chat"]')).toBeVisible();
  });

  test('start new direct conversation', async ({ page }) => {
    await page.goto('/messages');
    
    // Click start new conversation
    await page.click('[data-testid="new-conversation-button"]');
    
    // Should show user search modal
    await expect(page.locator('[data-testid="user-search-modal"]')).toBeVisible();
    
    // Search for a user
    await page.fill('[data-testid="user-search-input"]', 'mentor');
    await page.click('[data-testid="search-button"]');
    
    // Select a user from results
    await page.click('[data-testid="user-result-1"]');
    
    // Should open chat window
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-header"]')).toContainText('Test Mentor');
  });

  test('send and receive messages', async ({ page }) => {
    await page.goto('/messages/direct/2');
    
    // Should load existing conversation
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
    
    // Type a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Hello, this is a test message!');
    
    // Send message
    await page.click('[data-testid="send-button"]');
    
    // Should see message in chat
    await expect(page.locator('[data-testid="message-bubble"]').last()).toContainText('Hello, this is a test message!');
    
    // Message input should be cleared
    await expect(messageInput).toHaveValue('');
  });

  test('send message with Enter key', async ({ page }) => {
    await page.goto('/messages/direct/2');
    
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Message sent with Enter');
    await messageInput.press('Enter');
    
    // Should see message in chat
    await expect(page.locator('[data-testid="message-bubble"]').last()).toContainText('Message sent with Enter');
  });

  test('send file attachment', async ({ page }) => {
    await page.goto('/messages/direct/2');
    
    // Click attachment button
    await page.click('[data-testid="attachment-button"]');
    
    // Upload file
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test file')
    });
    
    // Should show file preview
    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-name"]')).toContainText('test.txt');
    
    // Send file
    await page.click('[data-testid="send-file-button"]');
    
    // Should see file message in chat
    await expect(page.locator('[data-testid="file-message"]').last()).toBeVisible();
  });

  test('show typing indicator', async ({ page, context }) => {
    // Open two pages for both users
    const page2 = await context.newPage();
    
    // Login as different user on page2
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', 'mentor@example.com');
    await page2.fill('[data-testid="password-input"]', 'TestPass123');
    await page2.click('[data-testid="login-button"]');
    
    // Both users go to same conversation
    await page.goto('/messages/direct/2');
    await page2.goto('/messages/direct/1');
    
    // User starts typing on page1
    await page.locator('[data-testid="message-input"]').fill('I am typing...');
    
    // Should show typing indicator on page2
    await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible();
    await expect(page2.locator('[data-testid="typing-indicator"]')).toContainText('User is typing...');
    
    // Clear input on page1
    await page.locator('[data-testid="message-input"]').clear();
    
    // Typing indicator should disappear on page2
    await expect(page2.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  });

  test('edit sent message', async ({ page }) => {
    await page.goto('/messages/direct/2');
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Original message');
    await page.click('[data-testid="send-button"]');
    
    // Hover over message to show options
    const lastMessage = page.locator('[data-testid="message-bubble"]').last();
    await lastMessage.hover();
    
    // Click edit button
    await page.click('[data-testid="edit-message-button"]');
    
    // Should show edit input
    await expect(page.locator('[data-testid="edit-input"]')).toBeVisible();
    
    // Edit message
    await page.fill('[data-testid="edit-input"]', 'Edited message');
    await page.click('[data-testid="save-edit-button"]');
    
    // Should show edited message
    await expect(lastMessage).toContainText('Edited message');
    await expect(lastMessage.locator('[data-testid="edited-indicator"]')).toContainText('(edited)');
  });

  test('delete sent message', async ({ page }) => {
    await page.goto('/messages/direct/2');
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Message to delete');
    await page.click('[data-testid="send-button"]');
    
    // Hover and delete
    const lastMessage = page.locator('[data-testid="message-bubble"]').last();
    await lastMessage.hover();
    await page.click('[data-testid="delete-message-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Should show deleted message
    await expect(lastMessage).toContainText('This message was deleted');
  });

  test('search conversations', async ({ page }) => {
    await page.goto('/messages');
    
    // Use search in conversation list
    await page.fill('[data-testid="conversation-search"]', 'mentor');
    
    // Should filter conversations
    await expect(page.locator('[data-testid="conversation-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="conversation-item"]')).toContainText('Test Mentor');
  });

  test('show connection status', async ({ page }) => {
    await page.goto('/messages');
    
    // Should show connected status
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
    await expect(page.locator('[data-testid="connection-indicator"]')).toHaveClass(/connected/);
  });

  test('handle connection loss', async ({ page }) => {
    await page.goto('/messages');
    
    // Simulate connection loss
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Should show disconnected status
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
    await expect(page.locator('[data-testid="connection-indicator"]')).toHaveClass(/disconnected/);
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-connection-button"]')).toBeVisible();
  });
});
