import { config } from './config/envValidation';
import { createApp } from './config/app';
import { prisma } from './config/database';
import { loadStatusCache } from './config/statusCache';
import { logger } from './config/logger';

async function start() {
  await prisma.$connect();
  logger.info('Database connected');

  await loadStatusCache();
  logger.info('Status cache loaded');

  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

start().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
