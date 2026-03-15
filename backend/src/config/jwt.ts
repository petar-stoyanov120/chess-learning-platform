import { config } from './envValidation';

export const jwtConfig = {
  accessSecret: config.jwtAccessSecret,
  refreshSecret: config.jwtRefreshSecret,
  accessExpiry: config.jwtAccessExpiry,
  refreshExpiry: config.jwtRefreshExpiry,
};
