import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { videoCallsAPI } from '../../services/api';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const CallFeedback = ({ 
  callId, 
  callDuration, 
  mentorship, 
  callPurpose, 
  onFeedbackSubmitted 
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [wasProductive, setWasProductive] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMentor = mentorship.mentorId === user?.id;
  const otherUser = isMentor ? mentorship.mentee : mentorship.mentor;
  const myRole = isMentor ? 'mentor' : 'mentee';

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPurposeText = (purpose) => {
    const purposes = {
      'general_session': 'General mentorship session',
      'goal_review': 'Goal review and planning',
      'problem_solving': 'Problem-solving discussion',
      'skill_development': 'Skill development session',
      'career_guidance': 'Career guidance',
      'project_review': 'Project review',
      'check_in': 'Quick check-in',
      'emergency': 'Urgent assistance'
    };
    return purposes[purpose] || 'Mentorship session';
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    if (wasProductive === null) {
      toast.error('Please indicate if the session was productive');
      return;
    }

    setIsSubmitting(true);
    try {
      await videoCallsAPI.endCall(callId, {
        duration: callDuration,
        rating,
        feedback: feedback.trim() || null,
        sessionNotes: sessionNotes.trim() || null,
        nextSteps: nextSteps.trim() || null,
        wasProductive
      });

      toast.success('Feedback submitted successfully!');
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted({
          rating,
          feedback,
          sessionNotes,
          nextSteps,
          wasProductive
        });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Session Complete!
        </h2>
        <p className="text-gray-600">
          Your {getPurposeText(callPurpose).toLowerCase()} with {otherUser.name} lasted {formatDuration(callDuration)}
        </p>
      </div>

      <div className="space-y-6">
        {/* Session Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you rate this session?
          </label>
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                {star <= rating ? (
                  <StarSolidIcon className="w-8 h-8 text-yellow-400" />
                ) : (
                  <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                )}
              </button>
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-500">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </span>
          </div>
        </div>

        {/* Productivity Assessment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Was this session productive?
          </label>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setWasProductive(true)}
              className={clsx(
                'flex items-center px-4 py-2 rounded-lg border-2 transition-colors',
                wasProductive === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-600 hover:border-green-300'
              )}
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Yes, very productive
            </button>
            <button
              onClick={() => setWasProductive(false)}
              className={clsx(
                'flex items-center px-4 py-2 rounded-lg border-2 transition-colors',
                wasProductive === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 text-gray-600 hover:border-red-300'
              )}
            >
              <XCircleIcon className="w-5 h-5 mr-2" />
              Could be better
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder={`Share your thoughts about this session with ${otherUser.name}...`}
            maxLength={1000}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {feedback.length}/1000
          </div>
        </div>

        {/* Session Notes (for both) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ClipboardDocumentListIcon className="w-4 h-4 inline mr-1" />
            Session notes (optional)
          </label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Key points discussed, insights gained, decisions made..."
            maxLength={2000}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {sessionNotes.length}/2000
          </div>
        </div>

        {/* Next Steps (primarily for mentors) */}
        {isMentor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ArrowRightIcon className="w-4 h-4 inline mr-1" />
              Next steps for {otherUser.name} (optional)
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Action items, goals, or recommendations for your mentee..."
              maxLength={1000}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {nextSteps.length}/1000
            </div>
            <p className="text-xs text-gray-500 mt-1">
              These will be shared with {otherUser.name} as action items
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || rating === 0 || wasProductive === null}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Feedback...
              </>
            ) : (
              <>
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Submit Feedback & End Session
              </>
            )}
          </button>
        </div>

        <div className="text-center text-xs text-gray-500">
          Your feedback helps improve the mentorship experience for everyone
        </div>
      </div>
    </div>
  );
};

export default CallFeedback;
