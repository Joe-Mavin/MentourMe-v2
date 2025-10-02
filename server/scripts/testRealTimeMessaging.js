const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create test users
const testUsers = [
  { id: 1, name: 'Test User 1', email: 'test1@example.com' },
  { id: 2, name: 'Test User 2', email: 'test2@example.com' }
];

// Generate test tokens
const generateToken = (user) => {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
};

// Test real-time messaging
async function testRealTimeMessaging() {
  console.log('🚀 Starting Real-Time Messaging Test...\n');

  // Create socket connections for both users
  const user1Token = generateToken(testUsers[0]);
  const user2Token = generateToken(testUsers[1]);

  const socket1 = io(SERVER_URL, {
    auth: { token: user1Token },
    transports: ['websocket', 'polling']
  });

  const socket2 = io(SERVER_URL, {
    auth: { token: user2Token },
    transports: ['websocket', 'polling']
  });

  // Test connection
  await new Promise((resolve) => {
    let connectedCount = 0;
    
    socket1.on('connect', () => {
      console.log('✅ User 1 connected:', socket1.id);
      connectedCount++;
      if (connectedCount === 2) resolve();
    });

    socket2.on('connect', () => {
      console.log('✅ User 2 connected:', socket2.id);
      connectedCount++;
      if (connectedCount === 2) resolve();
    });
  });

  // Test direct messaging
  console.log('\n📨 Testing Direct Messages...');
  
  // User 2 listens for messages from User 1
  socket2.on('new_direct_message', (message) => {
    console.log('✅ User 2 received direct message:', {
      from: message.sender?.name,
      content: message.content,
      timestamp: message.createdAt
    });
  });

  // User 1 sends a direct message to User 2
  socket1.emit('send_direct_message', {
    receiverId: testUsers[1].id,
    content: 'Hello from User 1! This is a real-time test message.',
    type: 'text'
  });

  // Wait a bit for message delivery
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test typing indicators
  console.log('\n⌨️  Testing Typing Indicators...');
  
  socket2.on('user_typing', (data) => {
    console.log('✅ User 2 sees typing indicator:', {
      user: data.user?.name,
      conversationId: data.conversationId
    });
  });

  socket2.on('user_stopped_typing', (data) => {
    console.log('✅ User 2 sees stopped typing:', {
      userId: data.userId,
      conversationId: data.conversationId
    });
  });

  // User 1 starts typing
  socket1.emit('typing_start', {
    receiverId: testUsers[1].id,
    conversationId: `direct_${testUsers[0].id}_${testUsers[1].id}`
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // User 1 stops typing
  socket1.emit('typing_stop', {
    receiverId: testUsers[1].id,
    conversationId: `direct_${testUsers[0].id}_${testUsers[1].id}`
  });

  // Test user status
  console.log('\n👥 Testing User Status...');
  
  socket2.on('user_status_change', (data) => {
    console.log('✅ User status change detected:', {
      userId: data.userId,
      status: data.status,
      timestamp: data.timestamp
    });
  });

  socket2.on('user_offline', (data) => {
    console.log('✅ User went offline:', {
      userId: data.userId,
      timestamp: data.timestamp
    });
  });

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Disconnect User 1 to test offline status
  console.log('\n🔌 Disconnecting User 1...');
  socket1.disconnect();

  // Wait for offline event
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Clean up
  socket2.disconnect();
  
  console.log('\n✅ Real-Time Messaging Test Complete!');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

// Run the test
testRealTimeMessaging().catch(console.error);
