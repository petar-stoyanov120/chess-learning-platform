import { prisma } from '../config/database';
import { logger } from '../config/logger';

export async function purgeExpiredRefreshTokens(): Promise<void> {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  if (count > 0) {
    logger.info({ count }, 'Purged expired refresh tokens');
  }
}
