import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MessagingProvider, useMessaging } from '../context/MessagingContext';
import { AuthContext } from '../../../context/AuthContext';

// Mock the API and socket service
jest.mock('../../../services/api', () => ({
  messagesAPI: {
    getConversations: jest.fn(),
    getMessages: jest.fn()
  }
}));

jest.mock('../../../services/socket', () => ({
  on: jest.fn(),
  off: jest.fn(),
  sendMessage: jest.fn(),
  startTyping: jest.fn(),
  stopTyping: jest.fn()
}));

// Test component to access messaging context
const TestComponent = () => {
  const { conversations, loading, loadConversations } = useMessaging();
  
  return (
    <div>
      <div data-testid="loading">{loading.conversations ? 'loading' : 'not loading'}</div>
      <div data-testid="conversations-count">{conversations.length}</div>
      <button onClick={loadConversations} data-testid="load-button">
        Load Conversations
      </button>
    </div>
  );
};

const renderWithProviders = (component) => {
  const mockUser = { id: 1, name: 'Test User' };
  
  return render(
    <AuthContext.Provider value={{ user: mockUser }}>
      <MessagingProvider>
        {component}
      </MessagingProvider>
    </AuthContext.Provider>
  );
};

describe('MessagingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial state', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('loading')).toHaveTextContent('not loading');
    expect(screen.getByTestId('conversations-count')).toHaveTextContent('0');
  });

  it('should load conversations', async () => {
    const mockConversations = [
      { id: 1, name: 'Test Conversation' }
    ];
    
    const { messagesAPI } = require('../../../services/api');
    messagesAPI.getConversations.mockResolvedValue({
      data: { conversations: mockConversations }
    });

    renderWithProviders(<TestComponent />);
    
    const loadButton = screen.getByTestId('load-button');
    loadButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('1');
    });
  });

  it('should handle API errors gracefully', async () => {
    const { messagesAPI } = require('../../../services/api');
    messagesAPI.getConversations.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<TestComponent />);
    
    const loadButton = screen.getByTestId('load-button');
    loadButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('0');
    });
  });
});
