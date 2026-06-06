import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL =', process.env.DATABASE_URL);
  console.log('Connecting...');
  await prisma.$connect();
  console.log('✅ Connected to PostgreSQL\n');

  // Applied migrations
  try {
    const migrations = await prisma.$queryRawUnsafe<any[]>(
      `SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at`
    );
    console.log('Applied migrations:');
    for (const m of migrations) {
      console.log(
        `  - ${m.migration_name} | finished=${m.finished_at ? 'yes' : 'NO'} | rolledBack=${m.rolled_back_at ? 'YES' : 'no'}`
      );
    }
    console.log('');
  } catch (e: any) {
    console.log('⚠️  Could not read _prisma_migrations:', e.message, '\n');
  }

  // Roles
  const roles = await prisma.role.findMany();
  console.log('Roles in DB:', roles.map((r) => `${r.id}:${r.name}`).join(', ') || '(none)');

  // Users
  const users = await prisma.user.findMany({ include: { role: true } });
  console.log(`\nUsers (${users.length}):`);
  for (const u of users) {
    console.log(
      `  - id=${u.id} email=${u.email} username=${u.username} role=${u.role.name} active=${u.isActive} failedAttempts=${u.failedLoginAttempts} lockedUntil=${u.lockedUntil ?? 'none'} hashLen=${u.passwordHash?.length ?? 0}`
    );
  }

  if (users.length === 0) {
    console.log('\n❌ NO USERS EXIST — this is why admin login fails. The seed never created an admin.');
  }
}

main()
  .catch((e) => {
    console.error('❌ ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
