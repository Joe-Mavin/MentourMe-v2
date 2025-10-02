const request = require('supertest');
const { app, server } = require('../../server');
const { User, Message, CommunityRoom, RoomMembership } = require('../../models');
const bcryptjs = require('bcryptjs');
const io = require('socket.io-client');

describe('Messaging Integration Tests', () => {
  let user1Token, user2Token;
  let user1, user2;
  let clientSocket1, clientSocket2;

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcryptjs.hash('TestPass123', 10);
    
    user1 = await User.create({
      name: 'User One',
      email: 'user1@example.com',
      password: hashedPassword,
      role: 'user',
      isActive: true
    });

    user2 = await User.create({
      name: 'User Two',
      email: 'user2@example.com',
      password: hashedPassword,
      role: 'user',
      isActive: true
    });

    // Login to get tokens
    const login1Response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'TestPass123' });
    user1Token = login1Response.body.data.token;

    const login2Response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@example.com', password: 'TestPass123' });
    user2Token = login2Response.body.data.token;
  });

  afterEach(async () => {
    if (clientSocket1) {
      clientSocket1.disconnect();
    }
    if (clientSocket2) {
      clientSocket2.disconnect();
    }
  });

  describe('Direct Messaging', () => {
    it('should send and receive direct messages', async () => {
      const messageData = {
        content: 'Hello, this is a test message',
        type: 'text',
        receiverId: user2.id
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe(messageData.content);
      expect(response.body.data.message.senderId).toBe(user1.id);
      expect(response.body.data.message.receiverId).toBe(user2.id);

      // Verify message was saved to database
      const savedMessage = await Message.findByPk(response.body.data.message.id);
      expect(savedMessage).toBeTruthy();
      expect(savedMessage.content).toBe(messageData.content);
    });

    it('should get direct messages between users', async () => {
      // Create test messages
      await Message.create({
        content: 'First message',
        type: 'text',
        senderId: user1.id,
        receiverId: user2.id
      });

      await Message.create({
        content: 'Second message',
        type: 'text',
        senderId: user2.id,
        receiverId: user1.id
      });

      const response = await request(app)
        .get(`/api/messages/direct/${user2.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.messages[0].content).toBeDefined();
    });

    it('should get conversation list', async () => {
      // Create test message
      await Message.create({
        content: 'Test conversation',
        type: 'text',
        senderId: user1.id,
        receiverId: user2.id
      });

      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toBeDefined();
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
    });

    it('should support message pagination', async () => {
      // Create multiple messages
      for (let i = 0; i < 15; i++) {
        await Message.create({
          content: `Message ${i}`,
          type: 'text',
          senderId: user1.id,
          receiverId: user2.id
        });
      }

      const response = await request(app)
        .get(`/api/messages/direct/${user2.id}?page=1&limit=10`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(10);
      expect(response.body.data.pagination.total).toBe(15);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('Community Room Messaging', () => {
    let testRoom;

    beforeEach(async () => {
      // Create test room
      testRoom = await CommunityRoom.create({
        name: 'Test Room',
        description: 'A test room for messaging',
        category: 'general',
        isPrivate: false,
        createdBy: user1.id
      });

      // Add users to room
      await RoomMembership.create({
        userId: user1.id,
        roomId: testRoom.id,
        role: 'admin'
      });

      await RoomMembership.create({
        userId: user2.id,
        roomId: testRoom.id,
        role: 'member'
      });
    });

    it('should send room message', async () => {
      const messageData = {
        content: 'Hello room!',
        type: 'text',
        roomId: testRoom.id
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe(messageData.content);
      expect(response.body.data.message.roomId).toBe(testRoom.id);
      expect(response.body.data.message.senderId).toBe(user1.id);
    });

    it('should get room messages', async () => {
      // Create test room message
      await Message.create({
        content: 'Room message',
        type: 'text',
        senderId: user1.id,
        roomId: testRoom.id
      });

      const response = await request(app)
        .get(`/api/messages/room/${testRoom.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.messages[0].content).toBe('Room message');
    });

    it('should reject room message from non-member', async () => {
      // Create another user not in the room
      const user3 = await User.create({
        name: 'User Three',
        email: 'user3@example.com',
        password: await bcryptjs.hash('TestPass123', 10),
        role: 'user',
        isActive: true
      });

      const login3Response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user3@example.com', password: 'TestPass123' });

      const messageData = {
        content: 'Unauthorized message',
        type: 'text',
        roomId: testRoom.id
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${login3Response.body.data.token}`)
        .send(messageData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are not a member of this room');
    });
  });

  describe('Message Operations', () => {
    let testMessage;

    beforeEach(async () => {
      testMessage = await Message.create({
        content: 'Original message',
        type: 'text',
        senderId: user1.id,
        receiverId: user2.id
      });
    });

    it('should edit own message', async () => {
      const response = await request(app)
        .put(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Edited message' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe('Edited message');
      expect(response.body.data.message.editedAt).toBeDefined();
    });

    it('should not edit other user\'s message', async () => {
      const response = await request(app)
        .put(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Hacked message' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });

    it('should delete own message', async () => {
      const response = await request(app)
        .delete(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify message is marked as deleted
      const deletedMessage = await Message.findByPk(testMessage.id);
      expect(deletedMessage.isDeleted).toBe(true);
    });
  });
});
