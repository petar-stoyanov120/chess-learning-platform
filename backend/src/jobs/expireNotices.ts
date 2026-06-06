import { prisma } from '../config/database';
import { logger } from '../config/logger';

export async function expireNotices(): Promise<void> {
  const { count } = await prisma.locationNotice.updateMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'expired' },
  });

  if (count > 0) {
    logger.info({ count }, 'Expired stale pending location notices');
  }
}
