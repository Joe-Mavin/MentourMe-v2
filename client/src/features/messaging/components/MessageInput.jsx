import React, { useState, useRef, useCallback } from 'react';
import { validateFileUpload, debounce } from '../utils/messageUtils';
import { 
  PaperAirplaneIcon,
  PhotoIcon,
  PaperClipIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import EmojiPicker from './EmojiPicker';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MessageInput = ({ 
  onSendMessage, 
  onTypingStart, 
  onTypingStop, 
  disabled, 
  placeholder = "Type a message..." 
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Debounced typing stop function
  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
    }, 1000),
    [isTyping, onTypingStop]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart();
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      onTypingStop();
      return;
    }

    // Reset the debounced stop typing
    if (value.trim()) {
      debouncedStopTyping();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && attachments.length === 0) return;
    if (disabled) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTypingStop();
    }

    try {
      // Send text message
      if (trimmedMessage) {
        await onSendMessage(trimmedMessage, 'text', attachments);
      }

      // Send attachments separately if no text
      if (!trimmedMessage && attachments.length > 0) {
        for (const attachment of attachments) {
          await onSendMessage(
            attachment.url, 
            attachment.type === 'image' ? 'image' : 'file',
            [{
              ...attachment,
              fileName: attachment.name,
              fileSize: attachment.size
            }]
          );
        }
      }

      // Clear input
      setMessage('');
      setAttachments([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = (e, type = 'file') => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const validation = validateFileUpload(file);
      
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Create file URL
      const url = URL.createObjectURL(file);
      
      const attachment = {
        id: `${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url,
        file
      };

      setAttachments(prev => [...prev, attachment]);
    });

    // Clear input
    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === attachmentId);
      if (attachment) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(a => a.id !== attachmentId);
    });
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(prev => prev + emoji);
    }
    
    setShowEmojiPicker(false);
  };

  // Auto-resize textarea
  const handleTextareaResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="p-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="relative group bg-gray-100 rounded-lg p-2 flex items-center space-x-2"
            >
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <PaperClipIcon className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(attachment.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* Attachment buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Upload image"
            disabled={disabled}
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Upload file"
            disabled={disabled}
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onInput={handleTextareaResize}
            placeholder={placeholder}
            disabled={disabled}
            className={clsx(
              'w-full px-4 py-2 pr-12 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'min-h-[40px] max-h-[120px] overflow-y-auto',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            rows={1}
          />
          
          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 bottom-2 p-1 text-gray-500 hover:text-gray-700 rounded"
            title="Add emoji"
            disabled={disabled}
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-10">
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            (message.trim() || attachments.length > 0) && !disabled
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
          title="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e, 'image')}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileUpload(e, 'file')}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;
