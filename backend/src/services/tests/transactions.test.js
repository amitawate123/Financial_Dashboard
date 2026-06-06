const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

let adminToken, userToken, adminId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_test');

  const createAndLogin = async (name, email, role) => {
    const reg = await request(app).post('/api/v1/auth/register').send({ name, email, password: 'password123', role });
    if (role === 'admin') adminId = reg.body.data._id;
    return reg.body.token;
  };

  adminToken = await createAndLogin('Admin', 'admin@t.com', 'admin');
  userToken = await createAndLogin('User', 'user@t.com', 'user');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await Transaction.deleteMany({});
});

const sampleTransaction = {
  amount: 2500,
  type: 'income',
  category: 'salary',
  date: '2024-06-15',
  notes: 'Monthly salary',
};

describe('POST /api/v1/transactions', () => {
  it('user can create a transaction', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send(sampleTransaction);

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(2500);
  });

  it('admin can create a transaction', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleTransaction);

    expect(res.status).toBe(201);
  });

  it('should reject invalid amount', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...sampleTransaction, amount: -100 });

    expect(res.status).toBe(400);
  });

  it('should reject invalid category', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...sampleTransaction, category: 'invalid_cat' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/transactions', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send(sampleTransaction);
  });

  it('user can list their own transactions', async () => {
    const res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('admin does not see other users transactions', async () => {
    const res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(0);
  });

  it('supports filtering by type', async () => {
    const res = await request(app)
      .get('/api/v1/transactions?type=income')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    res.body.transactions.forEach((t) => expect(t.type).toBe('income'));
  });

  it('supports pagination', async () => {
    const res = await request(app)
      .get('/api/v1/transactions?page=1&limit=5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(5);
  });
});

describe('PATCH /api/v1/transactions/:id', () => {
  let adminTxId;
  let userTxId;

  beforeEach(async () => {
    const adminRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleTransaction);
    adminTxId = adminRes.body.data._id;

    const userRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...sampleTransaction, notes: 'User transaction' });
    userTxId = userRes.body.data._id;
  });

  it('admin can update their own transaction', async () => {
    const res = await request(app)
      .patch(`/api/v1/transactions/${adminTxId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 3000 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(3000);
  });

  it('admin cannot update another users transaction', async () => {
    const res = await request(app)
      .patch(`/api/v1/transactions/${userTxId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 3000 });

    expect(res.status).toBe(404);
  });

  it('user can update their own transaction', async () => {
    const res = await request(app)
      .patch(`/api/v1/transactions/${userTxId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 2800 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(2800);
  });

  it('user cannot update another users transaction', async () => {
    const res = await request(app)
      .patch(`/api/v1/transactions/${adminTxId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 3000 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/transactions/:id', () => {
  let adminTxId;
  let userTxId;

  beforeEach(async () => {
    const adminRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleTransaction);
    adminTxId = adminRes.body.data._id;

    const userRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...sampleTransaction, notes: 'User transaction' });
    userTxId = userRes.body.data._id;
  });

  it('admin can soft-delete their own transaction', async () => {
    const res = await request(app)
      .delete(`/api/v1/transactions/${adminTxId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${adminToken}`);
    const ids = listRes.body.transactions.map((t) => t._id);
    expect(ids).not.toContain(adminTxId);
  });

  it('admin cannot delete another users transaction', async () => {
    const res = await request(app)
      .delete(`/api/v1/transactions/${userTxId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('user can soft-delete their own transaction', async () => {
    const res = await request(app)
      .delete(`/api/v1/transactions/${userTxId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${userToken}`);
    const ids = listRes.body.transactions.map((t) => t._id);
    expect(ids).not.toContain(userTxId);
  });

  it('user cannot delete another users transaction', async () => {
    const res = await request(app)
      .delete(`/api/v1/transactions/${adminTxId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });
});
