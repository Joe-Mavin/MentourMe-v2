import React from 'react';
import BlogManagement from '../components/blog/BlogManagement';

const BlogManagementPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogManagement />
      </div>
    </div>
  );
};

export default BlogManagementPage;
