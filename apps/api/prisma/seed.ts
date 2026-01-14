import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Seed Plans
  console.log('📦 Seeding plans...');
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Ücretsiz',
      description: 'Temel finans takibi için ideal başlangıç',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'TRY',
      maxTransactions: 100,
      maxBudgets: 3,
      maxSavingsGoals: 2,
      maxBankConnections: 0,
      maxHouseholdMembers: 0,
      features: JSON.stringify(['pdf_upload']),
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Pro',
      description: 'Gelişmiş özellikler ve sınırsız kullanım',
      priceMonthly: 49.90,
      priceYearly: 479.90,
      currency: 'TRY',
      maxTransactions: -1,
      maxBudgets: -1,
      maxSavingsGoals: -1,
      maxBankConnections: 3,
      maxHouseholdMembers: 5,
      features: JSON.stringify([
        'pdf_upload',
        'bank_connection',
        'ai_insights',
        'export_csv',
        'export_pdf',
        'household',
        'custom_categories',
        'advanced_reports',
      ]),
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { name: 'business' },
    update: {},
    create: {
      name: 'business',
      displayName: 'İşletme',
      description: 'Şirketler ve büyük aileler için tam özellikler',
      priceMonthly: 149.90,
      priceYearly: 1439.90,
      currency: 'TRY',
      maxTransactions: -1,
      maxBudgets: -1,
      maxSavingsGoals: -1,
      maxBankConnections: 10,
      maxHouseholdMembers: 20,
      features: JSON.stringify([
        'pdf_upload',
        'bank_connection',
        'ai_insights',
        'export_csv',
        'export_pdf',
        'household',
        'priority_support',
        'custom_categories',
        'advanced_reports',
        'api_access',
      ]),
      sortOrder: 3,
      isActive: true,
    },
  });
  console.log('✅ Plans seeded\n');

  // 2. Seed Demo User
  console.log('👤 Seeding demo user...');
  const hashedPassword = await bcrypt.hash('demo1234', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo Kullanıcı',
    },
  });
  console.log(`✅ Demo user created: ${demoUser.email} (password: demo1234)\n`);

  // 3. Assign free plan to demo user
  await prisma.userPlan.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      planId: freePlan.id,
      status: 'active',
    },
  });

  // 4. Seed User Preferences
  await prisma.userPreference.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      language: 'tr',
      currency: 'TRY',
      theme: 'light',
      emailNotifications: true,
      budgetAlerts: true,
    },
  });

  // 5. Seed Demo Transactions
  console.log('💳 Seeding demo transactions...');
  const categories = [
    { id: 'market', label: 'Market', type: 'expense' },
    { id: 'maas', label: 'Maaş', type: 'income' },
    { id: 'ulasim', label: 'Ulaşım', type: 'expense' },
    { id: 'fatura', label: 'Faturalar', type: 'expense' },
    { id: 'eglence', label: 'Eğlence', type: 'expense' },
    { id: 'saglik', label: 'Sağlık', type: 'expense' },
    { id: 'yatirim', label: 'Yatırım Geliri', type: 'income' },
    { id: 'kira', label: 'Kira', type: 'expense' },
  ];

  const now = new Date();
  const transactions = [
    // This month income
    { description: 'Maaş Ödemesi', amount: 45000, categoryId: 'maas', categoryLabel: 'Maaş', type: 'income', daysAgo: 1 },
    { description: 'Freelance Proje', amount: 5000, categoryId: 'maas', categoryLabel: 'Maaş', type: 'income', daysAgo: 5 },
    { description: 'Temettü Geliri', amount: 1200, categoryId: 'yatirim', categoryLabel: 'Yatırım Geliri', type: 'income', daysAgo: 10 },

    // This month expenses
    { description: 'Migros Market Alışverişi', amount: 850, categoryId: 'market', categoryLabel: 'Market', type: 'expense', daysAgo: 1 },
    { description: 'BİM Market', amount: 320, categoryId: 'market', categoryLabel: 'Market', type: 'expense', daysAgo: 3 },
    { description: 'A101 Alışveriş', amount: 450, categoryId: 'market', categoryLabel: 'Market', type: 'expense', daysAgo: 7 },
    { description: 'Kira Ödemesi', amount: 12000, categoryId: 'kira', categoryLabel: 'Kira', type: 'expense', daysAgo: 2 },
    { description: 'Elektrik Faturası', amount: 450, categoryId: 'fatura', categoryLabel: 'Faturalar', type: 'expense', daysAgo: 4 },
    { description: 'Doğalgaz Faturası', amount: 380, categoryId: 'fatura', categoryLabel: 'Faturalar', type: 'expense', daysAgo: 4 },
    { description: 'İnternet Faturası', amount: 250, categoryId: 'fatura', categoryLabel: 'Faturalar', type: 'expense', daysAgo: 5 },
    { description: 'İstanbulkart Yükleme', amount: 500, categoryId: 'ulasim', categoryLabel: 'Ulaşım', type: 'expense', daysAgo: 6 },
    { description: 'Taksi', amount: 180, categoryId: 'ulasim', categoryLabel: 'Ulaşım', type: 'expense', daysAgo: 8 },
    { description: 'Netflix Abonelik', amount: 99, categoryId: 'eglence', categoryLabel: 'Eğlence', type: 'expense', daysAgo: 9 },
    { description: 'Sinema', amount: 150, categoryId: 'eglence', categoryLabel: 'Eğlence', type: 'expense', daysAgo: 12 },
    { description: 'Eczane - İlaç', amount: 280, categoryId: 'saglik', categoryLabel: 'Sağlık', type: 'expense', daysAgo: 14 },

    // Last month
    { description: 'Maaş Ödemesi', amount: 45000, categoryId: 'maas', categoryLabel: 'Maaş', type: 'income', daysAgo: 32 },
    { description: 'Kira Ödemesi', amount: 12000, categoryId: 'kira', categoryLabel: 'Kira', type: 'expense', daysAgo: 33 },
    { description: 'Market Alışverişi', amount: 1200, categoryId: 'market', categoryLabel: 'Market', type: 'expense', daysAgo: 35 },
    { description: 'Faturalar', amount: 1100, categoryId: 'fatura', categoryLabel: 'Faturalar', type: 'expense', daysAgo: 36 },
  ];

  for (const tx of transactions) {
    const date = new Date(now);
    date.setDate(date.getDate() - tx.daysAgo);

    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        date,
        description: tx.description,
        amount: tx.amount,
        currency: 'TRY',
        source: 'manual',
        type: tx.type,
        categoryId: tx.categoryId,
        categoryLabel: tx.categoryLabel,
        confidence: 100,
        tags: '',
      },
    });
  }
  console.log(`✅ ${transactions.length} demo transactions created\n`);

  // 6. Seed Budgets
  console.log('📊 Seeding budgets...');
  const budgets = [
    { categoryId: 'market', categoryLabel: 'Market', limitAmount: 2000 },
    { categoryId: 'ulasim', categoryLabel: 'Ulaşım', limitAmount: 1000 },
    { categoryId: 'eglence', categoryLabel: 'Eğlence', limitAmount: 500 },
  ];

  for (const budget of budgets) {
    await prisma.budget.upsert({
      where: { userId_categoryId: { userId: demoUser.id, categoryId: budget.categoryId } },
      update: {},
      create: {
        userId: demoUser.id,
        categoryId: budget.categoryId,
        categoryLabel: budget.categoryLabel,
        limitAmount: budget.limitAmount,
        period: 'monthly',
        alertThreshold: 80,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${budgets.length} budgets created\n`);

  // 7. Seed Savings Goals
  console.log('🎯 Seeding savings goals...');
  const savingsGoals = [
    { name: 'Tatil Fonu', targetAmount: 30000, currentAmount: 12500, color: '#3B82F6', icon: '✈️' },
    { name: 'Acil Durum Fonu', targetAmount: 50000, currentAmount: 35000, color: '#10B981', icon: '🏦' },
  ];

  for (const goal of savingsGoals) {
    await prisma.savingsGoal.create({
      data: {
        userId: demoUser.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        color: goal.color,
        icon: goal.icon,
        isCompleted: false,
      },
    });
  }
  console.log(`✅ ${savingsGoals.length} savings goals created\n`);

  // 8. Seed Bills
  console.log('📅 Seeding bills...');
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const bills = [
    { name: 'Kira', amount: 12000, dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1), categoryId: 'kira', categoryLabel: 'Kira' },
    { name: 'Elektrik Faturası', amount: 450, dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15), categoryId: 'fatura', categoryLabel: 'Faturalar' },
    { name: 'İnternet', amount: 250, dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10), categoryId: 'fatura', categoryLabel: 'Faturalar' },
  ];

  for (const bill of bills) {
    await prisma.bill.create({
      data: {
        userId: demoUser.id,
        name: bill.name,
        amount: bill.amount,
        currency: 'TRY',
        dueDate: bill.dueDate,
        frequency: 'monthly',
        categoryId: bill.categoryId,
        categoryLabel: bill.categoryLabel,
        isPaid: false,
        reminderDays: 3,
      },
    });
  }
  console.log(`✅ ${bills.length} bills created\n`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   - 3 pricing plans');
  console.log('   - 1 demo user (demo@example.com / demo1234)');
  console.log(`   - ${transactions.length} transactions`);
  console.log(`   - ${budgets.length} budgets`);
  console.log(`   - ${savingsGoals.length} savings goals`);
  console.log(`   - ${bills.length} bills`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
