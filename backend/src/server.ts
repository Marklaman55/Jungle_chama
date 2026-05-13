import 'dotenv/config';
import createApp from './app.js';
import User from './models/User.js';
import SystemConfig from './models/SystemConfig.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const startServer = async () => {
  const app = await createApp();
  const PORT = process.env.PORT || 3000;

  try {
    // Bootstrap Admin User if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@Jungle2024', 10);
      const adminUser = new User({
        name: 'Jungle Admin',
        email: 'admin@junglechama.com',
        password: hashedPassword,
        phone: '254700000000',
        userId: uuidv4().slice(0, 8).toUpperCase(),
        role: 'admin',
        balance: 1000000
      });
      await adminUser.save();
      console.log('Default admin user created: admin@junglechama.com / Admin@Jungle2024');
    }

    // Also ensure the current user is an admin for convenience
    await User.findOneAndUpdate(
      { email: 'vincentkamau179@gmail.com' },
      { role: 'admin' }
    );

    // Initialize SystemConfig if it doesn't exist
    const config = await SystemConfig.findOne();
    if (!config) {
      await new SystemConfig({
        cycleOrder: [],
        currentIndex: 0,
        cycleDay: 1,
        systemState: 'RECRUITMENT',
      }).save();
      console.log('Initial system configuration created.');
    }

    app.listen(parseInt(process.env.PORT || '3000'), '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

const cleanup = async () => {
  console.log('Cleaning up resources before exit...');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

startServer();