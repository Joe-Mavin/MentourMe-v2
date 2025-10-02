import React from 'react';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const RecommendationFilters = ({
  searchTerm,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedSpecialization,
  onSpecializationChange,
  minCompatibility,
  onMinCompatibilityChange,
  sortBy,
  onSortChange,
  showAvailableOnly,
  onShowAvailableOnlyChange,
  locations = [],
  specializations = []
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, bio, or skills..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort by
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="compatibility">Compatibility Score</option>
          <option value="rating">Rating</option>
          <option value="experience">Experience</option>
          <option value="response_time">Response Time</option>
          <option value="last_active">Last Active</option>
        </select>
      </div>

      {/* Minimum Compatibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Compatibility: {minCompatibility}/10
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={minCompatibility}
          onChange={(e) => onMinCompatibilityChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Any</span>
          <span>Perfect</span>
        </div>
      </div>

      {/* Location Filter */}
      {locations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Any Location</option>
            {locations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Specialization Filter */}
      {specializations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialization
          </label>
          <select
            value={selectedSpecialization}
            onChange={(e) => onSpecializationChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Any Specialization</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Available Only */}
      <div className="flex items-center">
        <input
          id="available-only"
          type="checkbox"
          checked={showAvailableOnly}
          onChange={(e) => onShowAvailableOnlyChange(e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="available-only" className="ml-2 text-sm text-gray-700">
          Show only available mentors
        </label>
      </div>

      {/* Quick Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <QuickFilterButton
            active={minCompatibility >= 8}
            onClick={() => onMinCompatibilityChange(8)}
          >
            High Match
          </QuickFilterButton>
          <QuickFilterButton
            active={sortBy === 'rating'}
            onClick={() => onSortChange('rating')}
          >
            Top Rated
          </QuickFilterButton>
          <QuickFilterButton
            active={showAvailableOnly}
            onClick={() => onShowAvailableOnlyChange(!showAvailableOnly)}
          >
            Available Now
          </QuickFilterButton>
        </div>
      </div>
    </div>
  );
};

const QuickFilterButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={clsx(
      'px-3 py-1 text-sm rounded-full border transition-colors duration-200',
      active
        ? 'bg-primary-600 text-white border-primary-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    )}
  >
    {children}
  </button>
);

export default RecommendationFilters;

