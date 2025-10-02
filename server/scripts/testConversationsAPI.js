const axios = require('axios');

async function testConversationsAPI() {
  try {
    console.log('🧪 Testing Conversations API...');

    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'alice@example.com', // User 5 from our test
      password: 'password123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, got token');

    // Now test the conversations API
    const conversationsResponse = await axios.get('http://localhost:5000/api/messages/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Conversations API Response:');
    console.log('Status:', conversationsResponse.status);
    console.log('Data:', JSON.stringify(conversationsResponse.data, null, 2));

    if (conversationsResponse.data.data?.conversations) {
      console.log(`📊 Found ${conversationsResponse.data.data.conversations.length} conversations`);
      conversationsResponse.data.data.conversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.partner?.name || 'Unknown'} - Last: "${conv.lastMessage?.content?.substring(0, 30)}..."`);
      });
    } else {
      console.log('⚠️ No conversations found in response');
    }

  } catch (error) {
    console.error('❌ Conversations API test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data || error.message);
  }
}

module.exports = testConversationsAPI;

// Run if called directly
if (require.main === module) {
  testConversationsAPI()
    .then(() => {
      console.log('✅ Testing complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
