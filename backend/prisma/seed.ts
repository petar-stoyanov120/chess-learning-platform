import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Roles
  const roles = ['user', 'collaborator', 'admin'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Roles seeded');

  // Categories
  const categories = [
    { name: 'Openings', slug: 'openings', description: 'Learn chess opening theory and key moves.' },
    { name: 'Concepts', slug: 'concepts', description: 'Understand core chess concepts and strategies.' },
    { name: 'Endgames', slug: 'endgames', description: 'Master endgame techniques to convert advantages.' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Categories seeded');

  // Difficulty levels
  const levels = [
    { name: 'beginner', sortOrder: 1 },
    { name: 'intermediate', sortOrder: 2 },
    { name: 'advanced', sortOrder: 3 },
  ];
  for (const level of levels) {
    await prisma.difficultyLevel.upsert({
      where: { name: level.name },
      update: {},
      create: level,
    });
  }
  console.log('Difficulty levels seeded');

  // Post statuses
  const statuses = ['draft', 'pending_review', 'published', 'rejected'];
  for (const name of statuses) {
    await prisma.postStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Post statuses seeded');

  // Admin user
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!adminRole) throw new Error('Admin role not found');

  const adminPassword = await bcrypt.hash('K9#mPx2$vLqR', 10);
  await prisma.user.upsert({
    where: { email: 'chessplatform.admin@gmail.com' },
    update: {},
    create: {
      email: 'chessplatform.admin@gmail.com',
      username: 'chessmaster_admin',
      passwordHash: adminPassword,
      roleId: adminRole.id,
    },
  });
  console.log('Admin user seeded — check seed.ts for credentials');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
