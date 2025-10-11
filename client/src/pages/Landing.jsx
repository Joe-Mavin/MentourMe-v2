import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/branding/Logo';
import {
  ArrowRightIcon,
  CheckIcon,
  UserGroupIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  ShieldCheckIcon,
  FireIcon,
  BoltIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleNewsletterSignup = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setEmail('');
        setTimeout(() => setIsSubscribed(false), 3000);
      } else {
        alert(data.message || 'Failed to subscribe to newsletter');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      alert('Failed to subscribe to newsletter. Please try again.');
    }
  };

  const features = [
    {
      icon: FireIcon,
      title: 'Elite Mentors',
      description: 'Connect with battle-tested leaders who have conquered their fields.'
    },
    {
      icon: BoltIcon,
      title: 'Direct Access',
      description: 'No-nonsense communication. Get straight answers from those who have been there.'
    },
    {
      icon: TrophyIcon,
      title: 'Victory Mindset',
      description: 'Develop the mental fortitude to overcome any obstacle in your path.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Proven Systems',
      description: 'Time-tested strategies that separate winners from the rest.'
    }
  ];

  const stoicQuotes = [
    {
      quote: "The impediment to action advances action. What stands in the way becomes the way.",
      author: "Marcus Aurelius"
    },
    {
      quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
      author: "Marcus Aurelius"
    },
    {
      quote: "It is not what happens to you, but how you react to it that matters.",
      author: "Epictetus"
    },
    {
      quote: "The best revenge is not to be like your enemy.",
      author: "Marcus Aurelius"
    }
  ];

  const [currentQuote, setCurrentQuote] = useState(0);
  const [blogStats, setBlogStats] = useState({
    totalPosts: 0,
    totalMentors: 0,
    totalViews: 0
  });
  const [topMentors, setTopMentors] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % stoicQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch blog stats and top mentors
    const fetchBlogData = async () => {
      try {
        // Get blog posts count
        const blogResponse = await fetch('/api/blog?limit=1');
        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          // This would need pagination info to get total count
        }

        // Get top mentors
        const mentorsResponse = await fetch('/api/blog/top-mentors?limit=5');
        if (mentorsResponse.ok) {
          const mentorsData = await mentorsResponse.json();
          console.log('Top mentors data:', mentorsData);
          setTopMentors(mentorsData.data.mentors || []);
        } else {
          console.error('Failed to fetch top mentors:', mentorsResponse.status);
        }
      } catch (error) {
        console.error('Error fetching blog data:', error);
      }
    };

    fetchBlogData();
  }, []);

  const stats = [
    { label: 'Elite Mentors', value: '2,500+' },
    { label: 'Men Transformed', value: '15,000+' },
    { label: 'Countries', value: '50+' },
    { label: 'Success Rate', value: '98%' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="sm" />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors font-medium">Features</a>
              <Link to="/blog" className="text-gray-300 hover:text-white transition-colors font-medium">Battle Wisdom</Link>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium">Sign In</Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:from-orange-500 hover:to-red-500 transition-all duration-200 font-bold"
              >
                FORGE AHEAD
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2 sm:space-x-4">
              <Link to="/blog" className="text-gray-300 hover:text-white transition-colors font-medium text-xs sm:text-sm">Battle Wisdom</Link>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium text-xs sm:text-sm">Sign In</Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:shadow-lg hover:from-orange-500 hover:to-red-500 transition-all duration-200 font-bold text-xs sm:text-sm"
              >
                JOIN
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.1)_0%,transparent_50%)]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Stoic Quote */}
            <div className="mb-12">
              <blockquote className="text-lg md:text-xl text-gray-300 italic mb-4 max-w-4xl mx-auto">
                "{stoicQuotes[currentQuote].quote}"
              </blockquote>
              <cite className="text-orange-500 font-bold text-sm tracking-wider uppercase">
                — {stoicQuotes[currentQuote].author}
              </cite>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-8 leading-none">
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent">
                FORGE
              </span>
              <br />
              <span className="text-white">YOUR PATH</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed font-medium px-4">
              Connect with battle-tested mentors who have conquered their fields. 
              <br className="hidden sm:block" />
              <span className="text-orange-500 font-bold">No excuses. No shortcuts. Just results.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 sm:mb-16">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-lg font-black text-lg sm:text-xl hover:shadow-2xl hover:shadow-orange-500/25 hover:scale-105 transition-all duration-300 flex items-center space-x-3 border-2 border-orange-500 w-full sm:w-auto justify-center"
              >
                <FireIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>BEGIN THE FORGE</span>
                <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Masculine Visual Element */}
            <div className="relative max-w-4xl mx-auto px-4">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border border-gray-800">
                <div className="bg-black rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-700">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-700 flex items-center space-x-2">
                    <div className="flex space-x-1 sm:space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs sm:text-sm text-gray-300 font-bold">WARRIOR DASHBOARD</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-orange-500">
                        <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                        <h3 className="font-bold text-sm sm:text-base">5 Elite Mentors</h3>
                        <p className="text-xs sm:text-sm opacity-90">Battle-tested leaders</p>
                      </div>
                      <div className="bg-gradient-to-br from-red-600 to-orange-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-red-500">
                        <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                        <h3 className="font-bold text-sm sm:text-base">12 Victories</h3>
                        <p className="text-xs sm:text-sm opacity-90">This quarter</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-600 sm:col-span-2 md:col-span-1">
                        <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                        <h3 className="font-bold text-sm sm:text-base">8 Skills Forged</h3>
                        <p className="text-xs sm:text-sm opacity-90">Strength gained</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-300 font-bold uppercase tracking-wider text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
              WEAPONS FOR <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">VICTORY</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-medium px-4">
              The arsenal you need to dominate your field and crush your competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-gray-900 to-black p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-gray-800 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-orange-600 to-red-600 w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200 border-2 border-orange-500">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4 uppercase tracking-wide">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed font-medium text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 sm:px-6 lg:px-8 border-y border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 sm:mb-6">
            STOP MAKING <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">EXCUSES</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 font-medium px-4">
            Every day you wait is another day your competition gets ahead.
            <br className="hidden sm:block" />
            <span className="text-orange-500 font-black">The time is NOW.</span>
          </p>
          
          <Link
            to="/register"
            className="inline-flex items-center space-x-3 sm:space-x-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-lg font-black text-lg sm:text-2xl hover:shadow-2xl hover:shadow-orange-500/25 hover:scale-105 transition-all duration-300 border-2 border-orange-500"
          >
            <FireIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>CLAIM YOUR POWER</span>
            <ArrowRightIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl sm:rounded-3xl p-6 sm:p-12 border-2 border-gray-800">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4 uppercase tracking-wide">
              INTEL FOR <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">WARRIORS</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto font-medium">
              Get battle-tested strategies and exclusive intel delivered to your inbox.
              <br className="hidden sm:block" />
              <span className="text-orange-500 font-bold">No fluff. Just results.</span>
            </p>
            
            <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-sm sm:text-base"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-black hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 border border-orange-500 text-sm sm:text-base"
              >
                {isSubscribed ? (
                  <span className="flex items-center justify-center space-x-2">
                    <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>LOCKED IN!</span>
                  </span>
                ) : (
                  'JOIN THE ELITE'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Top Elite Mentors */}
      {topMentors.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  ELITE
                </span>
                <br />
                <span className="text-white">BATTLE COMMANDERS</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-medium px-4">
                Learn from the highest-ranked mentors who have proven their worth through 
                <span className="text-orange-500 font-bold"> battle-tested wisdom</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {topMentors.map((mentorRanking, index) => (
                <div
                  key={mentorRanking.mentor.id}
                  className="bg-gradient-to-br from-gray-900 to-black rounded-xl sm:rounded-2xl border border-gray-800 p-4 sm:p-6 hover:border-orange-500 transition-all duration-300 text-center"
                >
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-black text-lg sm:text-xl">
                          {mentorRanking.mentor.name.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-orange-600 rounded-full flex items-center justify-center border-2 border-black">
                        <span className="text-white font-black text-xs sm:text-sm">#{index + 1}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-lg font-black text-white mb-2">
                    {mentorRanking.mentor.name}
                  </h3>
                  
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <span className="px-2 sm:px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-orange-600 text-white">
                      🔥 {mentorRanking.tier}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-black text-orange-500">
                      {mentorRanking.overallScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      Battle Score
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-12">
              <Link
                to="/blog"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all font-bold text-base sm:text-lg"
              >
                <span>Discover All Battle Wisdom</span>
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-2">
              <Logo size="lg" className="mb-3 sm:mb-4" />
              <p className="text-gray-400 max-w-md leading-relaxed font-medium text-sm sm:text-base">
                Forging elite professionals through battle-tested mentorship. 
                <br />
                <span className="text-orange-500 font-bold">Where legends are made.</span>
              </p>
            </div>
            
            <div>
              <h3 className="font-black mb-3 sm:mb-4 text-orange-500 uppercase tracking-wider text-sm sm:text-base">Arsenal</h3>
              <ul className="space-y-2 sm:space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">Find Elite Mentors</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">Become a Mentor</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">Warrior Community</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">Battle Strategies</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-black mb-3 sm:mb-4 text-orange-500 uppercase tracking-wider text-sm sm:text-base">Command</h3>
              <ul className="space-y-2 sm:space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">About the Mission</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">Join the Elite</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">Privacy Shield</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors font-medium text-sm sm:text-base">Terms of War</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 font-medium text-sm sm:text-base text-center md:text-left">© 2024 MentourMe. <span className="text-orange-500">Forge your destiny.</span></p>
            <div className="flex items-center space-x-3 sm:space-x-6">
              <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              <span className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">Battle-Tested & Secure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
