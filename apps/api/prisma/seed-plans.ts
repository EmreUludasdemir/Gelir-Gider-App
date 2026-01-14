import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding plans...');

  // Free Plan
  await prisma.plan.upsert({
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

  // Pro Plan
  await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Pro',
      description: 'Gelişmiş özellikler ve sınırsız kullanım',
      priceMonthly: 49.90,
      priceYearly: 479.90, // ~20% discount
      currency: 'TRY',
      maxTransactions: -1, // Unlimited
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

  // Business Plan
  await prisma.plan.upsert({
    where: { name: 'business' },
    update: {},
    create: {
      name: 'business',
      displayName: 'İşletme',
      description: 'Şirketler ve büyük aileler için tam özellikler',
      priceMonthly: 149.90,
      priceYearly: 1439.90, // ~20% discount
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

  console.log('Plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
