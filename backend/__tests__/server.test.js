const request = require('supertest');
const app = require('../server');

describe('Server API', () => {
  it('should respond with welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Welcome to PinPoint API');
  });
});