import React, { useState } from 'react';
import {
  PencilIcon,
  FireIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const BlogEditor = ({ onClose, onSave, editingPost = null }) => {
  console.log('🎨 BlogEditor rendered!', { editingPost, onClose: !!onClose, onSave: !!onSave });
  
  const [formData, setFormData] = useState({
    title: editingPost?.title || '',
    excerpt: editingPost?.excerpt || '',
    content: editingPost?.content || '',
    category: editingPost?.category || 'leadership',
    tags: editingPost?.tags || [],
    featuredImage: editingPost?.featuredImage || '',
    metaDescription: editingPost?.metaDescription || ''
  });
  
  const [newTag, setNewTag] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'leadership', name: 'Leadership', icon: '👑' },
    { id: 'strategy', name: 'Strategy', icon: '🛡️' },
    { id: 'career_growth', name: 'Career Growth', icon: '📈' },
    { id: 'entrepreneurship', name: 'Entrepreneurship', icon: '🚀' },
    { id: 'technology', name: 'Technology', icon: '⚡' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'personal_development', name: 'Personal Development', icon: '💪' },
    { id: 'industry_insights', name: 'Industry Insights', icon: '🔍' },
    { id: 'war_stories', name: 'War Stories', icon: '🔥' },
    { id: 'tactical_guides', name: 'Tactical Guides', icon: '⚔️' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleSave = async (status = 'draft') => {
    try {
      setLoading(true);
      
      const blogData = {
        ...formData,
        status,
        readTime: calculateReadTime(formData.content)
      };

      await onSave(blogData);
      onClose();
    } catch (error) {
      console.error('Error saving blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === formData.category);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <PencilIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {editingPost ? 'Edit Battle Wisdom' : 'Share Your Battle Wisdom'}
              </h2>
              <p className="text-sm text-gray-400">
                Forge content that transforms warriors
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all',
                isPreview
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              <EyeIcon className="w-4 h-4" />
              <span>{isPreview ? 'Edit' : 'Preview'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Editor Panel */}
          <div className={clsx(
            'flex-1 p-6 overflow-y-auto',
            isPreview ? 'hidden' : 'block'
          )}>
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Battle Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a powerful title that commands attention..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-bold text-lg"
                />
              </div>

              {/* Category & Featured Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                    Battle Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                    placeholder="https://example.com/warrior-image.jpg"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Battle Summary (Excerpt)
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Write a compelling summary that makes warriors want to read more..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.excerpt.length}/500 characters
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Battle Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Share your battle-tested wisdom. Tell your story. Provide tactical guidance that transforms lives..."
                  rows={15}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none font-mono"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formData.content.split(/\s+/).length} words</span>
                  <span>~{calculateReadTime(formData.content)} min read</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Battle Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-1 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-orange-700 rounded-full p-0.5"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  SEO Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="Brief description for search engines..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.metaDescription.length}/160 characters
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className={clsx(
            'flex-1 p-6 overflow-y-auto bg-black border-l border-gray-800',
            isPreview ? 'block' : 'hidden'
          )}>
            <div className="max-w-4xl mx-auto">
              {/* Preview Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full uppercase tracking-wider">
                    {selectedCategory?.icon} {selectedCategory?.name}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ~{calculateReadTime(formData.content)} min read
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                  {formData.title || 'Your Battle Title'}
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  {formData.excerpt || 'Your battle summary will appear here...'}
                </p>
              </div>

              {/* Featured Image */}
              {formData.featuredImage && (
                <div className="mb-8">
                  <img
                    src={formData.featuredImage}
                    alt={formData.title}
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-invert prose-orange max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {formData.content || 'Your battle content will appear here...'}
                </div>
              </div>

              {/* Tags */}
              {formData.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            {formData.content.split(/\s+/).length} words • ~{calculateReadTime(formData.content)} min read
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={loading || !formData.title || !formData.content}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            
            <button
              onClick={() => handleSave('published')}
              disabled={loading || !formData.title || !formData.content || !formData.excerpt}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FireIcon className="w-4 h-4" />
              <span>{loading ? 'Publishing...' : 'Publish Battle'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
