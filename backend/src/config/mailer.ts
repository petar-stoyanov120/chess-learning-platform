import nodemailer from 'nodemailer';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (smtpHost && smtpPort) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });
  logger.info('SMTP transport configured');
} else {
  logger.warn('SMTP not configured — email notifications disabled');
}

/**
 * Send an email. Returns true on success, false on failure.
 * Logs failures via pino and never throws — a mail error must not crash a request.
 */
export async function sendMail(options: nodemailer.SendMailOptions): Promise<boolean> {
  if (!transporter) {
    logger.warn({ to: options.to, subject: options.subject }, 'Email skipped — SMTP not configured');
    return false;
  }
  try {
    await transporter.sendMail(options);
    return true;
  } catch (err) {
    logger.error({ err, to: options.to, subject: options.subject }, 'Failed to send email');
    return false;
  }
}

export { transporter };
