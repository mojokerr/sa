import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@boostgram.ai' },
    update: {},
    create: {
      email: 'admin@boostgram.ai',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      verified: true,
      credits: 10000,
      subscription: 'ENTERPRISE',
      isActive: true,
    },
  });

  // Create super admin user
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@boostgram.ai' },
    update: {},
    create: {
      email: 'superadmin@boostgram.ai',
      name: 'Super Admin',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      verified: true,
      credits: 50000,
      subscription: 'ENTERPRISE',
      isActive: true,
    },
  });

  // Create test users
  const user1Password = await bcrypt.hash('user123', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      name: 'Ahmed Hassan',
      password: user1Password,
      role: 'USER',
      verified: true,
      credits: 500,
      subscription: 'PRO',
      phone: '+201234567890',
      country: 'Egypt',
      isActive: true,
    },
  });

  const user2Password = await bcrypt.hash('user123', 12);
  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      name: 'Sarah Mohammed',
      password: user2Password,
      role: 'USER',
      verified: true,
      credits: 250,
      subscription: 'BASIC',
      phone: '+966501234567',
      country: 'Saudi Arabia',
      isActive: true,
    },
  });

  const user3Password = await bcrypt.hash('user123', 12);
  const user3 = await prisma.user.upsert({
    where: { email: 'user3@example.com' },
    update: {},
    create: {
      email: 'user3@example.com',
      name: 'Omar Ali',
      password: user3Password,
      role: 'USER',
      verified: true,
      credits: 100,
      subscription: 'FREE',
      phone: '+971501234567',
      country: 'UAE',
      isActive: true,
    },
  });

  // Create sample orders
  const orders = [
    {
      userId: user1.id,
      groupLink: 'https://t.me/techcommunity',
      targetCount: 5000,
      currentCount: 5000,
      status: 'COMPLETED',
      priority: 'HIGH',
      notes: 'Tech community growth - completed successfully',
      price: 50.0,
      paymentStatus: 'PAID',
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: user1.id,
      groupLink: 'https://t.me/cryptotraders',
      targetCount: 10000,
      currentCount: 7500,
      status: 'PROCESSING',
      priority: 'URGENT',
      notes: 'Crypto trading community expansion',
      price: 150.0,
      paymentStatus: 'PAID',
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
    {
      userId: user2.id,
      groupLink: 'https://t.me/businessnetwork',
      targetCount: 2500,
      currentCount: 0,
      status: 'PENDING',
      priority: 'NORMAL',
      notes: 'Business networking group',
      price: 25.0,
      paymentStatus: 'PAID',
    },
    {
      userId: user2.id,
      groupLink: 'https://t.me/startupshub',
      targetCount: 7500,
      currentCount: 7500,
      status: 'COMPLETED',
      priority: 'HIGH',
      notes: 'Startup community - excellent results',
      price: 112.5,
      paymentStatus: 'PAID',
      completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    },
    {
      userId: user3.id,
      groupLink: 'https://t.me/gamingcommunity',
      targetCount: 1000,
      currentCount: 500,
      status: 'PROCESSING',
      priority: 'LOW',
      notes: 'Gaming community growth',
      price: 8.0,
      paymentStatus: 'PAID',
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
    {
      userId: user3.id,
      groupLink: 'https://t.me/movielovers',
      targetCount: 3000,
      currentCount: 0,
      status: 'CANCELLED',
      priority: 'NORMAL',
      notes: 'Movie lovers community - cancelled by user',
      price: 30.0,
      paymentStatus: 'REFUNDED',
      cancelledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  ];

  for (const orderData of orders) {
    await prisma.order.create({
      data: orderData,
    });
  }

  // Create order progress entries
  const processingOrders = await prisma.order.findMany({
    where: { status: 'PROCESSING' },
  });

  for (const order of processingOrders) {
    const progressEntries = Math.floor(order.currentCount / 1000); // One entry per 1000 members
    for (let i = 1; i <= progressEntries; i++) {
      await prisma.orderProgress.create({
        data: {
          orderId: order.id,
          count: i * 1000,
          message: `Progress update: ${i * 1000} members added`,
          createdAt: new Date(Date.now() - (progressEntries - i) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Create notifications
  const notifications = [
    {
      userId: user1.id,
      title: 'Order Completed Successfully!',
      message: 'Your order for Tech Community (5,000 members) has been completed.',
      type: 'SUCCESS',
      actionUrl: '/dashboard',
    },
    {
      userId: user1.id,
      title: 'Order In Progress',
      message: 'Your Crypto Traders community order is 75% complete.',
      type: 'INFO',
      actionUrl: '/dashboard',
    },
    {
      userId: user2.id,
      title: 'Welcome to BoostGram AI!',
      message: 'Your account has been created successfully. Start growing your communities today!',
      type: 'SUCCESS',
    },
    {
      userId: user3.id,
      title: 'Order Cancelled',
      message: 'Your Movie Lovers community order has been cancelled and refunded.',
      type: 'WARNING',
      actionUrl: '/dashboard',
    },
  ];

  for (const notificationData of notifications) {
    await prisma.notification.create({
      data: notificationData,
    });
  }

  // Create system settings
  const settings = [
    { key: 'site_name', value: 'BoostGram AI', type: 'string' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean' },
    { key: 'max_order_size', value: '100000', type: 'number' },
    { key: 'min_order_size', value: '10', type: 'number' },
    { key: 'default_credits', value: '100', type: 'number' },
    { key: 'price_per_member', value: '0.01', type: 'number' },
    { key: 'support_email', value: 'support@boostgram.ai', type: 'string' },
    { key: 'telegram_bot_token', value: '', type: 'string' },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: setting,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('🔑 Demo Accounts:');
  console.log('Super Admin: superadmin@boostgram.ai / superadmin123');
  console.log('Admin: admin@boostgram.ai / admin123');
  console.log('User 1: user1@example.com / user123 (PRO - 500 credits)');
  console.log('User 2: user2@example.com / user123 (BASIC - 250 credits)');
  console.log('User 3: user3@example.com / user123 (FREE - 100 credits)');
  console.log('');
  console.log('📊 Sample Data:');
  console.log('- 6 orders with various statuses');
  console.log('- Progress tracking for processing orders');
  console.log('- Notifications for users');
  console.log('- System settings configured');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });