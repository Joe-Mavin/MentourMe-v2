import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Format message timestamp for display
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
};

/**
 * Format conversation last message time
 */
export const formatConversationTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDistanceToNow(date, { addSuffix: false });
  }
};

/**
 * Get message preview text for conversation list
 */
export const getMessagePreview = (message, maxLength = 50) => {
  if (!message) return '';
  
  let preview = '';
  
  switch (message.type) {
    case 'text':
      preview = message.content;
      break;
    case 'image':
      preview = '📷 Image';
      break;
    case 'file':
      preview = `📎 ${message.fileName || 'File'}`;
      break;
    case 'emoji':
      preview = message.content;
      break;
    default:
      preview = message.content || 'Message';
  }
  
  return preview.length > maxLength 
    ? `${preview.substring(0, maxLength)}...` 
    : preview;
};

/**
 * Generate conversation display name
 */
export const getConversationName = (conversation, currentUserId) => {
  if (conversation.type === 'group') {
    return conversation.name || 'Group Chat';
  }
  
  // For direct messages, show the other participant's name
  const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId);
  return otherParticipant?.name || 'Unknown User';
};

/**
 * Get conversation avatar
 */
export const getConversationAvatar = (conversation, currentUserId) => {
  if (conversation.type === 'group') {
    return conversation.avatar || null;
  }
  
  // For direct messages, show the other participant's avatar
  const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId);
  return otherParticipant?.avatar || null;
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId, onlineUsers) => {
  return onlineUsers.some(user => user.id === userId);
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }
  
  return { valid: true };
};

/**
 * Generate unique message ID
 */
export const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Scroll to bottom of messages container
 */
export const scrollToBottom = (containerRef, smooth = true) => {
  if (containerRef.current) {
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant'
    });
  }
};

/**
 * Check if should auto-scroll (user is near bottom)
 */
export const shouldAutoScroll = (containerRef, threshold = 100) => {
  if (!containerRef.current) return true;
  
  const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
  return scrollHeight - scrollTop - clientHeight < threshold;
};

/**
 * Debounce function for typing indicators
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Group messages by date
 */
export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(message => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages,
    displayDate: formatDateHeader(date)
  }));
};

/**
 * Format date header for message groups
 */
const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMMM d, yyyy');
  }
};

/**
 * Check if message is from current user
 */
export const isOwnMessage = (message, currentUserId) => {
  return message.senderId === currentUserId;
};

/**
 * Get message status icon
 */
export const getMessageStatusIcon = (status) => {
  switch (status) {
    case 'sending':
      return '⏳';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓';
    case 'failed':
      return '❌';
    default:
      return '';
  }
};

/**
 * Get message status color class
 */
export const getMessageStatusColor = (status) => {
  switch (status) {
    case 'sending':
      return 'text-gray-400';
    case 'sent':
      return 'text-blue-400';
    case 'delivered':
      return 'text-blue-500';
    case 'read':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
};
