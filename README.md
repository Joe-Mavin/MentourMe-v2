# MentourMe - Professional Mentorship Platform

<div align="center">
  <img src="https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=MentourMe" alt="MentourMe Logo" />
  
  **Empowering Growth Through Expert Mentorship**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Deploy to Production](https://github.com/Joe-Mavin/MentourMe-v2/actions/workflows/deploy.yml/badge.svg)](https://github.com/Joe-Mavin/MentourMe-v2/actions/workflows/deploy.yml)
  [![Scheduled Tasks](https://github.com/Joe-Mavin/MentourMe-v2/actions/workflows/scheduled-tasks.yml/badge.svg)](https://github.com/Joe-Mavin/MentourMe-v2/actions/workflows/scheduled-tasks.yml)

## Overview

MentourMe is a modern, feature-rich mentorship platform that connects ambitious professionals with industry experts. Built with cutting-edge technologies, it provides real-time communication, goal tracking, and comprehensive mentorship management tools.

### Key Features

- Expert Mentor Matching - AI-powered mentor-mentee pairing
- Real-Time Messaging - Instant communication with Socket.IO
- HD Video Mentoring - WebRTC-powered video calls with screen sharing
- Smart Scheduling - Intelligent calendar integration
- Goal Tracking - Personalized career development paths
- Community Rooms - Topic-based discussion groups
- Email Integration - Automated notifications with testmail.app
- Responsive Design - Mobile-first, modern UI/UX
- Enterprise Security - JWT authentication, data encryption

## Features

### Authentication & User Management
- **User Registration & Login** with JWT authentication
- **Role-based Access Control** (User, Mentor, Admin)
- **Mentor Approval System** - Admin approval required for mentors
- **Profile Management** with avatars and preferences

### Onboarding System
- **Comprehensive Onboarding Flow** for new users
- **Goal Setting & Challenge Identification**
- **Availability Scheduling** with timezone support
- **AI-Ready Recommendation Engine** (hooks prepared for ML integration)
- **Interest & Communication Style Matching**

### Mentorship Features
- **Smart Mentor-Mentee Matching** based on goals, struggles, and compatibility
- **Task Assignment & Progress Tracking** with status management
- **Task Verification System** for mentors
- **Priority Levels & Due Dates** for structured progress

### Real-time Communication
- **Socket.IO Integration** for real-time messaging
- **Direct Messaging** between users and mentors
- **Community Chat Rooms** with different categories
- **Typing Indicators** and read receipts
- **Message History** with pagination

### Video Calling (WebRTC)
- **One-to-One Video Calls** between mentors and mentees
- **Community Room Video Calls** for group sessions
- **WebRTC Signaling** with fallback support
- **Call Management** with status tracking

### Community Features
- **Community Rooms** by category (Support, Goals, Accountability, etc.)
- **Room Membership Management** with roles (Admin, Moderator, Member)
- **Group Messaging** within rooms
- **Room Discovery** and joining system

### Admin Dashboard
- **Mentor Approval Workflow** with review system
- **User Management** with status controls
- **Platform Analytics** and statistics
- **Community Room Management**
- **Content Moderation** tools

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MariaDB** database with Sequelize ORM
- **Socket.IO** for real-time communication
- **JWT** authentication with bcrypt password hashing
- **Express Rate Limiting** for security
- **Helmet** for security headers
- **Multer** for file uploads

### Frontend
- **React 18** with modern hooks
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom components
- **React Router Dom** for navigation
- **Socket.IO Client** for real-time features
- **React Hook Form** with Yup validation
- **React Hot Toast** for notifications
- **React Select** for enhanced form controls
- **Heroicons** for consistent iconography

### Development & Production
- **ESLint** for code quality
- **Environment Configuration** for different stages
- **Database Seeders** with sample data
- **Production-Ready** with security best practices

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MariaDB (v10.4 or higher)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MentourMe
```

### 2. Backend Setup
```bash
cd server
npm install

# Create environment file
cp .env.example .env

# Configure your database connection in .env
DB_NAME=mentourme
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=127.0.0.1
DB_PORT=3306
JWT_SECRET=supersecretkey123!@#
```

### 3. Database Setup
```bash
# Make sure MariaDB is running
# Create the database
mysql -u root -p
CREATE DATABASE mentourme;
exit

# Run database migrations and seed data
npm run seed
```

### 4. Frontend Setup
```bash
cd ../client
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_SERVER_URL=http://localhost:5000" >> .env
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Socket.IO**: ws://localhost:5000

## 🎯 Demo Credentials

The seeder creates the following demo accounts:

### Admin Account
- **Email**: admin@mentourme.com
- **Password**: Admin123!

### Mentor Account
- **Email**: john.mentor@example.com
- **Password**: Mentor123!

### User Account
- **Email**: alice@example.com
- **Password**: User123!

## 🏗 Project Structure

```
MentourMe/
├── server/                 # Backend Express.js application
│   ├── config/            # Database configuration
│   ├── controllers/       # API route controllers
│   ├── middleware/        # Authentication & validation middleware
│   ├── models/           # Sequelize database models
│   ├── routes/           # API route definitions
│   ├── services/         # Socket.IO & WebRTC services
│   ├── seeders/          # Database seed data
│   └── server.js         # Main server entry point
│
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── context/      # React context providers
│   │   ├── pages/        # Main page components
│   │   ├── services/     # API and Socket.IO services
│   │   └── App.jsx       # Main App component
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
│
└── README.md             # This file
```

## 🗄 Database Schema

### Core Models
- **User** - User accounts with roles and approval status
- **OnboardingData** - User goals, struggles, availability, and preferences
- **Message** - Real-time messaging with file support
- **CommunityRoom** - Group chat rooms with categories
- **RoomMembership** - User membership in rooms with roles
- **Task** - Mentorship tasks with progress tracking

### Key Relationships
- Users have onboarding data and can be mentors or mentees
- Messages can be direct (user-to-user) or room-based
- Tasks link mentors to mentees with status tracking
- Rooms have members with different permission levels

## 🔐 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt with salt rounds
- **Role-Based Access Control** with permission checks
- **Rate Limiting** to prevent abuse
- **Input Validation** on all API endpoints
- **CORS Configuration** for secure cross-origin requests
- **Helmet** security headers for production
- **Environment Variables** for sensitive configuration

## 🚀 Deployment

### Frontend Deployment (Netlify)

1. **Build the application**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `cd client && npm run build`
   - Set publish directory: `client/dist`
   - Add environment variables in Netlify dashboard

### Backend Deployment (Railway/Heroku)

1. **Environment Variables**:
   ```env
   NODE_ENV=production
   DATABASE_URL=your_production_database_url
   JWT_SECRET=your_production_jwt_secret
   CLIENT_URL=https://your-frontend-domain.netlify.app
   TESTMAIL_USERNAME=your_testmail_username
   TESTMAIL_PASSWORD=your_testmail_password
   ```

2. **Database Setup**:
   - Create production database (MySQL/MariaDB)
   - Run migrations: `npm run migrate`
   - Seed initial data: `npm run seed`

### Email Configuration (testmail.app)

1. **Sign up for testmail.app** (free tier available)
2. **Configure environment variables**:
   ```env
   TESTMAIL_USERNAME=your_username
   TESTMAIL_PASSWORD=your_password
   TESTMAIL_NAMESPACE=mentourme.testmail.app
   ```
3. **Email features enabled**:
   - Welcome emails for new users
   - Mentor match notifications
   - Session reminders
   - Newsletter subscriptions
   - Password reset emails

## 📧 Email Integration Features

### Automated Email Workflows
- **Welcome Series**: New user onboarding emails
- **Mentor Matching**: Notification when matched with a mentor
- **Session Reminders**: Upcoming mentorship session alerts
- **Newsletter**: Weekly career insights and tips
- **Password Recovery**: Secure password reset links

### Email Templates
All emails feature:
- Modern, responsive design
- Gradient branding consistent with the platform
- Clear call-to-action buttons
- Professional HTML templates
- Mobile-optimized layouts

## 🎨 Design System

### Brand Colors
- **Primary**: Blue to Purple gradient (`#3B82F6` to `#8B5CF6`)
- **Secondary**: Indigo (`#4F46E5`)
- **Success**: Green (`#10B981`)
- **Warning**: Orange (`#F59E0B`)
- **Error**: Red (`#EF4444`)

### Logo & Branding
- Modern gradient logo with mentorship symbolism
- Minimalistic design representing connection and growth
- Scalable SVG format for all screen sizes
- Professional typography with Tailwind CSS fonts

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Messaging Endpoints
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/direct/:userId` - Get direct messages
- `POST /api/messages` - Send message
- `POST /api/messages/delivered` - Mark messages as delivered

### Real-time Events (Socket.IO)
- `new_direct_message` - New direct message received
- `new_room_message` - New room message received
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline

## 🧪 Testing

### Manual Testing
1. **User Registration & Login**
2. **Mentor Approval Workflow**
3. **Real-time Messaging**
4. **Video Call Functionality**
5. **Community Room Features**
6. **Email Notifications**

### Test Accounts
Use the seeded demo accounts for testing different user roles and permissions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Socket.IO** for real-time communication
- **WebRTC** for video calling capabilities
- **Tailwind CSS** for the beautiful UI
- **testmail.app** for email testing and delivery
- **React** and **Node.js** communities for excellent documentation

## 📞 Support

For support, email support@mentourme.com or join our community Discord server.

---

<div align="center">
  <strong>Built with ❤️ by the MentourMe Team</strong>
  
  [Website](https://mentourme.netlify.app) • [Documentation](https://docs.mentourme.com) • [Discord](https://discord.gg/mentourme)
</div>
- **SQL Injection Protection** via Sequelize ORM
- **XSS Protection** with Helmet security headers

## 🚀 Production Deployment

### Environment Variables
```bash
# Production settings
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com

# Database
DB_NAME=mentourme_prod
DB_USER=your_db_user
DB_PASSWORD=secure_password
DB_HOST=your_db_host

# Security
JWT_SECRET=your_very_secure_jwt_secret
JWT_EXPIRES_IN=7d
```

### Build Commands
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Onboarding Endpoints
- `POST /api/onboarding` - Submit onboarding data
- `GET /api/onboarding` - Get user's onboarding data
- `GET /api/onboarding/recommendations` - Get mentor recommendations

### Task Management
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task (mentors only)
- `PATCH /api/tasks/:id/status` - Update task status
- `GET /api/tasks/stats` - Get task statistics

### Messaging
- `GET /api/messages/conversations` - Get user's conversations
- `GET /api/messages/direct/:userId` - Get direct messages
- `GET /api/messages/room/:roomId` - Get room messages
- `POST /api/messages` - Send message

### Admin Functions
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/mentors/pending` - Pending mentor approvals
- `PUT /api/admin/mentors/:id/approve` - Approve/reject mentor

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- **AI-Powered Mentor Matching** with machine learning algorithms
- **Calendar Integration** for scheduling mentorship sessions
- **Mobile App** with React Native
- **Video Recording** for session playback
- **Advanced Analytics** with detailed progress tracking
- **Payment Integration** for premium mentorship services
- **Multi-language Support** for global accessibility

## 💡 Support

For support, email support@mentourme.com or create an issue in the repository.

---

**MentourMe** - Empowering growth through meaningful mentorship connections. 🌟

