import cron from 'node-cron';
import { logger } from '../config/logger';
import { expireNotices } from './expireNotices';
import { purgeExpiredRefreshTokens } from './purgeRefreshTokens';
import { sendParentDigest } from './parentDigest';

function wrap(name: string, fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
    } catch (err) {
      logger.error({ err }, `Scheduled job failed: ${name}`);
    }
  };
}

export function startJobs(): void {
  // Every hour — flip pending notices past their expiresAt to "expired"
  cron.schedule('0 * * * *', wrap('expireNotices', expireNotices));

  // Daily at 02:00 — delete refresh tokens whose expiresAt has passed
  cron.schedule('0 2 * * *', wrap('purgeRefreshTokens', purgeExpiredRefreshTokens));

  // Daily at 07:00 — parent digest (P3.6, stub until Parent role is added)
  cron.schedule('0 7 * * *', wrap('parentDigest', sendParentDigest));

  logger.info('Scheduled jobs started');
}
