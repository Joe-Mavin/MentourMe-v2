const { sequelize } = require('../models');

// Setup test database
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DB_DATABASE = 'mentourme_test';
  
  try {
    // Connect to test database
    await sequelize.authenticate();
    console.log('Test database connected successfully');
    
    // Sync database with force: true for clean state
    await sequelize.sync({ force: true });
    console.log('Test database synced successfully');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Test database cleanup failed:', error);
  }
});

// Reset database before each test
beforeEach(async () => {
  try {
    // Clear all tables while preserving structure
    const models = Object.values(sequelize.models);
    
    // Disable foreign key checks
    await sequelize.query('SET foreign_key_checks = 0;');
    
    // Truncate all tables
    for (const model of models) {
      await model.destroy({ 
        where: {},
        force: true,
        truncate: true 
      });
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET foreign_key_checks = 1;');
  } catch (error) {
    console.error('Test database reset failed:', error);
  }
});

// Global test timeout
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.info = jest.fn();
}
