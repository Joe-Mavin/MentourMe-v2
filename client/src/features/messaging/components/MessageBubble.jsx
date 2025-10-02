import React, { useState } from 'react';
import { 
  formatMessageTime, 
  getMessageStatusIcon,
  getMessageStatusColor,
  isOwnMessage 
} from '../utils/messageUtils';
import { 
  DocumentIcon, 
  PhotoIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const MessageBubble = ({ message, isOwn, isGroupStart, isGroupEnd }) => {
  const [showActions, setShowActions] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        );

      case 'image':
        return (
          <div className="relative max-w-xs">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            )}
            {imageError ? (
              <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
                <PhotoIcon className="w-8 h-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Image failed to load</span>
              </div>
            ) : (
              <img
                src={message.content}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onLoad={handleImageLoad}
                onError={handleImageError}
                onClick={() => window.open(message.content, '_blank')}
              />
            )}
            {message.caption && (
              <div className="mt-2 text-sm">
                {message.caption}
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
            <div className="flex-shrink-0">
              <DocumentIcon className="w-8 h-8 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.fileName || 'File'}
              </p>
              {message.fileSize && (
                <p className="text-xs text-gray-500">
                  {formatFileSize(message.fileSize)}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDownload(message.content, message.fileName)}
              className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 rounded"
              title="Download"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          </div>
        );

      case 'emoji':
        return (
          <div className="text-3xl">
            {message.content}
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            Unsupported message type
          </div>
        );
    }
  };

  return (
    <div
      className={clsx(
        'flex items-end space-x-2 group',
        isOwn ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (for other users, only on group end) */}
      {!isOwn && isGroupEnd && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          {message.sender?.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-gray-600">
              {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      )}

      {/* Spacer for grouped messages */}
      {!isOwn && !isGroupEnd && (
        <div className="w-8"></div>
      )}

      {/* Message bubble */}
      <div
        className={clsx(
          'relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl',
          isOwn
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-900',
          isGroupStart && isOwn && 'rounded-tr-md',
          isGroupStart && !isOwn && 'rounded-tl-md',
          isGroupEnd && isOwn && 'rounded-br-md',
          isGroupEnd && !isOwn && 'rounded-bl-md'
        )}
      >
        {/* Sender name (for group chats, non-own messages, group start) */}
        {!isOwn && isGroupStart && message.sender?.name && (
          <div className="text-xs font-medium text-gray-600 mb-1">
            {message.sender.name}
          </div>
        )}

        {/* Message content */}
        {renderMessageContent()}

        {/* Message time and status */}
        <div
          className={clsx(
            'flex items-center justify-end space-x-1 mt-1 text-xs',
            isOwn ? 'text-primary-100' : 'text-gray-500'
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {isOwn && (
            <div className="flex items-center space-x-1">
              {message.editedAt && (
                <span className="text-xs opacity-75">edited</span>
              )}
              {message.status && (
                <span 
                  className={clsx(
                    'transition-colors duration-200',
                    isOwn ? 'text-white/70' : getMessageStatusColor(message.status)
                  )}
                  title={`Message ${message.status}`}
                >
                  {getMessageStatusIcon(message.status)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message actions */}
      {showActions && (
        <div className="flex-shrink-0">
          <button
            className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="More actions"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default MessageBubble;
