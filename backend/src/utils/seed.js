require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const CATEGORIES = ['salary', 'freelance', 'food', 'transport', 'housing', 'utilities', 'entertainment', 'shopping'];

const randomBetween = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const verifiedAt = new Date();
    const users = await User.create([
      {
        name: 'Alice Admin',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin',
        isEmailVerified: true,
        emailVerifiedAt: verifiedAt,
      },
      {
        name: 'Uma User',
        email: 'user@demo.com',
        password: 'password123',
        role: 'user',
        isEmailVerified: true,
        emailVerifiedAt: verifiedAt,
      },
    ]);
    console.log(`Created ${users.length} users`);

    const [admin, demoUser] = users;

    // Generate user-wise sample data: 30 transactions per demo account
    const transactions = [];
    for (const owner of [admin, demoUser]) {
      for (let i = 0; i < 30; i++) {
        const daysAgo = Math.floor(Math.random() * 180);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        const type = Math.random() > 0.4 ? 'expense' : 'income';
        const category = type === 'income'
          ? randomItem(['salary', 'freelance'])
          : randomItem(['food', 'transport', 'housing', 'utilities', 'entertainment', 'shopping']);

        transactions.push({
          amount: type === 'income' ? randomBetween(1000, 8000) : randomBetween(20, 2000),
          type,
          category,
          date,
          notes: `${type === 'income' ? 'Received' : 'Paid'} for ${category}`,
          createdBy: owner._id,
        });
      }
    }

    await Transaction.insertMany(transactions);
    console.log(`Created ${transactions.length} transactions`);

    console.log('\n✅ Seed complete! Demo credentials:');
    console.log('  Admin: admin@demo.com / password123');
    console.log('  User:  user@demo.com  / password123');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
