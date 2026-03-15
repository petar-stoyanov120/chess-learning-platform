import { execSync } from 'child_process';

export default async function globalSetup() {
  // Set test database URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/chess_platform_test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-do-not-use-in-production';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-production';
  process.env.NODE_ENV = 'test';

  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: { ...process.env },
    });
  } catch {
    // Migrations may already be applied
  }
}
