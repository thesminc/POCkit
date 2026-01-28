/**
 * Jest Test Setup
 * POCkit Server Tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock environment variables for tests
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.BRAVE_SEARCH_API_KEY = 'test-brave-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
