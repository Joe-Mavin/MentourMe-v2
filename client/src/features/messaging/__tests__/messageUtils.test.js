import {
  formatMessageTime,
  formatConversationTime,
  getMessagePreview,
  getConversationName,
  validateFileUpload,
  groupMessagesByDate,
  isOwnMessage
} from '../utils/messageUtils';

describe('messageUtils', () => {
  describe('formatMessageTime', () => {
    it('should format today messages with time', () => {
      const today = new Date();
      const result = formatMessageTime(today.toISOString());
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should format yesterday messages', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatMessageTime(yesterday.toISOString());
      expect(result).toBe('Yesterday');
    });

    it('should handle invalid timestamps', () => {
      expect(formatMessageTime(null)).toBe('');
      expect(formatMessageTime(undefined)).toBe('');
    });
  });

  describe('getMessagePreview', () => {
    it('should return text content for text messages', () => {
      const message = { type: 'text', content: 'Hello world' };
      expect(getMessagePreview(message)).toBe('Hello world');
    });

    it('should return emoji for image messages', () => {
      const message = { type: 'image', content: 'image-url' };
      expect(getMessagePreview(message)).toBe('📷 Image');
    });

    it('should return file name for file messages', () => {
      const message = { type: 'file', fileName: 'document.pdf' };
      expect(getMessagePreview(message)).toBe('📎 document.pdf');
    });

    it('should truncate long messages', () => {
      const message = { type: 'text', content: 'A'.repeat(100) };
      const result = getMessagePreview(message, 50);
      expect(result).toBe('A'.repeat(50) + '...');
    });
  });

  describe('getConversationName', () => {
    it('should return group name for group conversations', () => {
      const conversation = { type: 'group', name: 'Team Chat' };
      expect(getConversationName(conversation, 1)).toBe('Team Chat');
    });

    it('should return other participant name for direct messages', () => {
      const conversation = {
        type: 'direct',
        participants: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      };
      expect(getConversationName(conversation, 1)).toBe('Jane');
    });

    it('should return default for unknown users', () => {
      const conversation = { type: 'direct', participants: [] };
      expect(getConversationName(conversation, 1)).toBe('Unknown User');
    });
  });

  describe('validateFileUpload', () => {
    it('should accept valid files', () => {
      const file = {
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg'
      };
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const file = {
        size: 11 * 1024 * 1024, // 11MB
        type: 'image/jpeg'
      };
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject unsupported file types', () => {
      const file = {
        size: 1024,
        type: 'application/exe'
      };
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });
  });

  describe('groupMessagesByDate', () => {
    it('should group messages by date', () => {
      const messages = [
        { id: 1, createdAt: '2023-01-01T10:00:00Z', content: 'Message 1' },
        { id: 2, createdAt: '2023-01-01T11:00:00Z', content: 'Message 2' },
        { id: 3, createdAt: '2023-01-02T10:00:00Z', content: 'Message 3' }
      ];

      const result = groupMessagesByDate(messages);
      expect(result).toHaveLength(2);
      expect(result[0].messages).toHaveLength(2);
      expect(result[1].messages).toHaveLength(1);
    });
  });

  describe('isOwnMessage', () => {
    it('should return true for own messages', () => {
      const message = { senderId: 1 };
      expect(isOwnMessage(message, 1)).toBe(true);
    });

    it('should return false for other messages', () => {
      const message = { senderId: 2 };
      expect(isOwnMessage(message, 1)).toBe(false);
    });
  });
});
