import nodemailer from 'nodemailer';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'noreply@chesslearn.local';

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

export async function sendApprovalEmail(to: string, contentTitle: string, contentType: 'lesson' | 'blog post') {
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: `Your ${contentType} has been approved!`,
      html: `<p>Great news! Your ${contentType} <strong>${contentTitle}</strong> has been approved and is now published on ChessLearn.</p>`,
    });
  } catch (err) {
    logger.error(err, 'Failed to send approval email');
  }
}

export async function sendRejectionEmail(to: string, contentTitle: string, contentType: 'lesson' | 'blog post', reason: string) {
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: `Your ${contentType} needs changes`,
      html: `<p>Your ${contentType} <strong>${contentTitle}</strong> was not approved.</p><p><strong>Reason:</strong> ${reason}</p><p>Please edit and resubmit.</p>`,
    });
  } catch (err) {
    logger.error(err, 'Failed to send rejection email');
  }
}
