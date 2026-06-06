const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const AuthActionToken = require('../../models/AuthActionToken');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
  await AuthActionToken.deleteMany({});
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.password).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    await User.create({ name: 'A', email: 'dup@example.com', password: 'pass123' });
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'B',
      email: 'dup@example.com',
      password: 'pass123',
    });
    expect(res.status).toBe(409);
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'X',
      email: 'not-an-email',
      password: 'pass123',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'X',
      email: 'x@x.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'password123',
    });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('should reject unknown email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('should issue new tokens and rotate refresh token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Refresh Test',
      email: 'refresh@example.com',
      password: 'password123',
    });
    const oldRefresh = reg.body.refreshToken;

    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefresh });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(oldRefresh);

    const retry = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefresh });
    expect(retry.status).toBe(401);
  });

  it('should reject missing refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should revoke refresh token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Logout Test',
      email: 'logout@example.com',
      password: 'password123',
    });
    const { refreshToken } = reg.body;

    const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return authenticated user profile', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Me Test',
      email: 'me@example.com',
      password: 'password123',
    });
    const token = reg.body.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@example.com');
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
