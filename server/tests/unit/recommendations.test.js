const request = require('supertest');
const { app } = require('../../server');
const { User, OnboardingData } = require('../../models');
const bcryptjs = require('bcryptjs');

describe('Recommendations Routes', () => {
  let userToken, mentorToken;
  let testUser, testMentor;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcryptjs.hash('TestPass123', 10);
    
    testUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'user',
      isActive: true
    });

    testMentor = await User.create({
      name: 'Test Mentor',
      email: 'mentor@example.com',
      password: hashedPassword,
      role: 'mentor',
      isActive: true,
      approved: true
    });

    // Create onboarding data
    await OnboardingData.create({
      userId: testUser.id,
      age: 25,
      goals: ['fitness', 'career'],
      struggles: ['motivation', 'time management'],
      availability: ['monday', 'wednesday', 'friday'],
      preferredCommunicationStyle: 'supportive',
      completedAt: new Date()
    });

    await OnboardingData.create({
      userId: testMentor.id,
      age: 30,
      interests: ['fitness', 'career'],
      expertise: ['motivation', 'leadership'],
      availability: ['monday', 'tuesday', 'wednesday'],
      preferredCommunicationStyle: 'supportive',
      completedAt: new Date()
    });

    // Login to get tokens
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'TestPass123' });
    userToken = userLoginResponse.body.data.token;

    const mentorLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mentor@example.com', password: 'TestPass123' });
    mentorToken = mentorLoginResponse.body.data.token;
  });

  describe('GET /api/recommendations', () => {
    it('should get recommendations for user', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should reject request for user without onboarding', async () => {
      // Create user without onboarding
      const newUser = await User.create({
        name: 'New User',
        email: 'new@example.com',
        password: await bcryptjs.hash('TestPass123', 10),
        role: 'user',
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'new@example.com', password: 'TestPass123' });

      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please complete onboarding to get personalized recommendations');
    });

    it('should support filtering by location', async () => {
      const response = await request(app)
        .get('/api/recommendations?location=New York')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.location).toBe('New York');
    });

    it('should support sorting by compatibility', async () => {
      const response = await request(app)
        .get('/api/recommendations?sortBy=compatibility')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters.sortBy).toBe('compatibility');
    });
  });

  describe('POST /api/recommendations/request', () => {
    it('should create mentorship request successfully', async () => {
      const requestData = {
        mentorId: testMentor.id,
        message: 'I would like to work with you as a mentor',
        matchScore: 8.5
      };

      const response = await request(app)
        .post('/api/recommendations/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requestId).toBeDefined();
      expect(response.body.data.request.mentorId).toBe(testMentor.id);
      expect(response.body.data.request.menteeId).toBe(testUser.id);
      expect(response.body.data.request.status).toBe('pending');
    });

    it('should reject request from mentor', async () => {
      const requestData = {
        mentorId: testUser.id,
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/recommendations/request')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send(requestData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only users can send mentorship requests');
    });

    it('should reject request to non-existent mentor', async () => {
      const requestData = {
        mentorId: 99999,
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/recommendations/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mentor not found');
    });

    it('should reject request to unapproved mentor', async () => {
      await testMentor.update({ approved: false });

      const requestData = {
        mentorId: testMentor.id,
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/recommendations/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mentor is not approved yet');
    });

    it('should reject duplicate pending request', async () => {
      const requestData = {
        mentorId: testMentor.id,
        message: 'Test message'
      };

      // First request
      await request(app)
        .post('/api/recommendations/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(201);

      // Second request (duplicate)
      const response = await request(app)
        .post('/api/recommendations/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You already have a pending request with this mentor');
    });

    it('should validate required fields', async () => {
      const requestData = {
        message: 'Test message'
        // Missing mentorId
      };

      const response = await request(app)
        .post('/api/recommendations/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors');
    });
  });

  describe('GET /api/recommendations/filters', () => {
    it('should get available filters', async () => {
      const response = await request(app)
        .get('/api/recommendations/filters')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toBeDefined();
      expect(response.body.data.specializations).toBeDefined();
      expect(Array.isArray(response.body.data.specializations)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/filters')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });
});
