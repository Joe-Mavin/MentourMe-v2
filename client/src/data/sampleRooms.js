// Sample community rooms for MentourMe platform
// These can be used for seeding the database or as examples

export const SAMPLE_ROOMS = [
  {
    id: "sample_1",
    name: "🎯 New Mentor Orientation",
    description: "Welcome space for new mentors to learn best practices, share experiences, and get support from experienced mentors.",
    category: "mentorship",
    isPrivate: false,
    maxMembers: 100,
    memberCount: 45,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    rules: "Be supportive and share your mentoring experiences. Ask questions freely and help others learn.",
    createdBy: "Admin",
    featured: true
  },
  {
    id: "sample_2",
    name: "🚀 Career Transition Support",
    description: "For professionals navigating career changes. Share strategies, get advice, and find accountability partners.",
    category: "goals",
    isPrivate: false,
    maxMembers: 75,
    memberCount: 32,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    rules: "Share your career journey respectfully. Offer constructive advice and maintain confidentiality.",
    createdBy: "Sarah Johnson",
    featured: true
  },
  {
    id: "sample_3",
    name: "🤝 Daily Accountability Check-ins",
    description: "Daily check-ins to share goals, progress, and challenges. Stay motivated with peer support.",
    category: "accountability",
    isPrivate: false,
    maxMembers: 50,
    memberCount: 28,
    lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    rules: "Check in daily with your goals and progress. Be encouraging and supportive to others.",
    createdBy: "Mike Chen",
    featured: true
  },
  {
    id: "sample_4",
    name: "💚 Mental Health & Wellness",
    description: "A safe space to discuss mental health, wellness strategies, and self-care practices.",
    category: "support",
    isPrivate: false,
    maxMembers: 60,
    memberCount: 41,
    lastActivity: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    rules: "Be compassionate and respectful. Share resources and support each other's wellness journey.",
    createdBy: "Dr. Lisa Park",
    featured: true
  },
  {
    id: "sample_5",
    name: "📚 Tech Skills Exchange",
    description: "Learn and teach technical skills. From coding to design, share knowledge and grow together.",
    category: "skills",
    isPrivate: false,
    maxMembers: 80,
    memberCount: 67,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    rules: "Share knowledge freely. Be patient with beginners and celebrate everyone's progress.",
    createdBy: "Alex Rodriguez",
    featured: false
  },
  {
    id: 6,
    name: "🌐 Startup Founders Network",
    description: "Connect with fellow entrepreneurs, share challenges, and build valuable business relationships.",
    category: "networking",
    isPrivate: false,
    maxMembers: 40,
    memberCount: 23,
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    rules: "Network authentically. Share opportunities and support each other's ventures.",
    createdBy: "Emma Thompson",
    featured: false
  },
  {
    id: 7,
    name: "🌱 Personal Growth Journey",
    description: "Explore personal development, mindfulness, and life balance. Share insights and grow together.",
    category: "wellness",
    isPrivate: false,
    maxMembers: 55,
    memberCount: 38,
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    rules: "Be open and vulnerable. Support each other's growth with kindness and understanding.",
    createdBy: "Jordan Williams",
    featured: false
  },
  {
    id: 8,
    name: "🎯 First-Time Mentees",
    description: "New to mentorship? Learn how to make the most of your mentoring relationship and set clear goals.",
    category: "mentorship",
    isPrivate: false,
    maxMembers: 70,
    memberCount: 52,
    lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    rules: "Ask questions freely. Share your mentorship experiences and learn from others.",
    createdBy: "Rachel Green",
    featured: false
  },
  {
    id: 9,
    name: "🚀 30-Day Goal Challenge",
    description: "Join our monthly goal-setting challenge. Set ambitious goals and achieve them together!",
    category: "goals",
    isPrivate: false,
    maxMembers: 100,
    memberCount: 89,
    lastActivity: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    rules: "Commit to your 30-day goal. Check in regularly and cheer others on their journey.",
    createdBy: "David Kim",
    featured: true
  },
  {
    id: 10,
    name: "💚 Crisis Support Circle",
    description: "Immediate support for those going through difficult times. Professional moderators available.",
    category: "support",
    isPrivate: true,
    maxMembers: 25,
    memberCount: 15,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    rules: "Maintain strict confidentiality. Be supportive and non-judgmental. Seek professional help when needed.",
    createdBy: "MentourMe Support Team",
    featured: false
  }
];

// Helper function to get rooms by category
export const getRoomsByCategory = (category) => {
  if (category === 'all') return SAMPLE_ROOMS;
  return SAMPLE_ROOMS.filter(room => room.category === category);
};

// Helper function to get featured rooms
export const getFeaturedRooms = () => {
  return SAMPLE_ROOMS.filter(room => room.featured);
};

// Helper function to search rooms
export const searchRooms = (query) => {
  const searchTerm = query.toLowerCase();
  return SAMPLE_ROOMS.filter(room => 
    room.name.toLowerCase().includes(searchTerm) ||
    room.description.toLowerCase().includes(searchTerm)
  );
};
