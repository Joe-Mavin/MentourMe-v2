import React, { forwardRef, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { groupMessagesByDate } from '../utils/messageUtils';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const MessageList = forwardRef(({ 
  messages, 
  currentUserId, 
  loading, 
  hasMore, 
  onScroll, 
  onLoadMore, 
  className 
}, ref) => {
  const loadMoreRef = useRef(null);
  const messageGroups = groupMessagesByDate(messages);

  // Intersection Observer for loading more messages
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (loading && messages.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center h-full', className)}>
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ArrowDownIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-sm text-gray-500">Start the conversation by sending a message below</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={clsx('overflow-y-auto px-4 py-4 space-y-4', className)}
      onScroll={onScroll}
    >
      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-2">
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Load more messages
            </button>
          )}
        </div>
      )}

      {/* Message groups by date */}
      {messageGroups.map((group) => (
        <div key={group.date} className="space-y-4">
          {/* Date header */}
          <div className="flex justify-center">
            <div className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
              {group.displayDate}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {group.messages.map((message, index) => {
              const prevMessage = index > 0 ? group.messages[index - 1] : null;
              const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;
              
              // Group consecutive messages from the same sender
              const isGroupStart = !prevMessage || prevMessage.senderId !== message.senderId;
              const isGroupEnd = !nextMessage || nextMessage.senderId !== message.senderId;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  isGroupStart={isGroupStart}
                  isGroupEnd={isGroupEnd}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
