import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface TicketEmailData {
  bookingReference: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName?: string;
  city?: string;
  isOnline: boolean;
  totalAmount: number;
  tickets: Array<{
    ticketNumber: string;
    ticketToken: string;
    ticketTypeName: string;
    attendeeName: string;
    price: number;
    qrCodeDataUrl?: string;
  }>;
}

export class EmailService {
  private transporter: Transporter | null = null;
  public devSentEmails: Array<EmailOptions & { sentAt: Date; id: string }> = [];

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    // If SMTP environment variables are present, configure real SMTP transport
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        console.log(`📧 SMTP Email Transporter initialized with host: ${smtpHost}`);
      } catch (err: any) {
        console.warn('⚠️ Failed to initialize SMTP transporter:', err.message);
        this.transporter = null;
      }
    } else {
      console.log('ℹ️ SMTP credentials not provided. Using resilient In-Memory Dev Email Simulation.');
    }
  }

  /**
   * Core send email method with fallback simulation
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId: string; simulated?: boolean }> {
    const fromAddress = process.env.SMTP_FROM || 'EVENTRA Platform <noreply@eventra.com>';
    const emailId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Record email in dev preview store
    this.devSentEmails.unshift({
      ...options,
      sentAt: new Date(),
      id: emailId,
    });
    // Keep max 50 recent dev emails
    if (this.devSentEmails.length > 50) {
      this.devSentEmails.pop();
    }

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          text: options.text || options.subject,
          html: options.html,
        });
        console.log(`✅ Email delivered to ${options.to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId, simulated: false };
      } catch (err: any) {
        console.warn(`⚠️ SMTP dispatch error to ${options.to}: ${err.message}. Retaining in dev preview.`);
      }
    }

    // Dev mode / Fallback log
    console.log(`📨 [EMAIL DISPATCH TO: ${options.to}]`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   Email ID: ${emailId}`);

    return { success: true, messageId: emailId, simulated: true };
  }

  /**
   * 1. Send Account Email Verification
   */
  async sendVerificationEmail(to: string, name: string, token: string, otpCode: string): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${appUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your EVENTRA Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #F8FAFC; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .brand { font-size: 24px; font-weight: 800; color: #FF6A00; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
    h1 { color: #FFFFFF; font-size: 22px; margin-top: 0; }
    p { color: #94A3B8; font-size: 14px; line-height: 1.6; }
    .otp-box { background: #1E293B; border: 1px dashed #FF6A00; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FF6A00; }
    .btn { display: inline-block; background: linear-gradient(135deg, #FF6A00, #FF3D8E); color: #FFFFFF !important; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin: 18px 0; }
    .footer { font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">EVENTRA</div>
    <h1>Welcome, ${name}!</h1>
    <p>Thank you for registering. Please confirm your email address to unlock full booking, reservation, and pass management features.</p>
    
    <div class="otp-box">
      <div style="font-size: 12px; text-transform: uppercase; color: #94A3B8; margin-bottom: 6px;">Your 6-Digit Security Code</div>
      <div class="otp-code">${otpCode}</div>
    </div>

    <div style="text-align: center;">
      <a href="${verifyLink}" class="btn">Verify Email Address Now →</a>
    </div>

    <p style="font-size: 12px; color: #64748B;">This link and security code expire in 24 hours. If you did not create an account on EVENTRA, you can safely ignore this email.</p>
    
    <div class="footer">
      EVENTRA Ticketing Technologies • Secure Digital Passes<br>
      Automated system message. Please do not reply directly.
    </div>
  </div>
</body>
</html>
    `;

    const res = await this.sendEmail({
      to,
      subject: `Verify your EVENTRA account (Code: ${otpCode})`,
      html,
    });
    return res.success;
  }

  /**
   * 2. Send Password Reset Email
   */
  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password - EVENTRA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #F8FAFC; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .brand { font-size: 24px; font-weight: 800; color: #FF6A00; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
    h1 { color: #FFFFFF; font-size: 22px; margin-top: 0; }
    p { color: #94A3B8; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #FF6A00, #FF3D8E); color: #FFFFFF !important; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin: 20px 0; }
    .token-box { background: #1E293B; border: 1px solid #334155; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 11px; color: #E2E8F0; word-break: break-all; margin-top: 15px; }
    .footer { font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">EVENTRA</div>
    <h1>Password Reset Request</h1>
    <p>Hello ${name}, we received a request to reset the password for your EVENTRA account. Click the button below to choose a new password:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="btn">Reset Password →</a>
    </div>

    <p style="font-size: 13px; color: #94A3B8;">Or copy and paste this direct security link into your browser:</p>
    <div class="token-box">${resetLink}</div>

    <p style="font-size: 12px; color: #64748B; margin-top: 20px;">This link is valid for 15 minutes. If you did not request a password reset, your account is secure and no action is required.</p>
    
    <div class="footer">
      EVENTRA Security Operations • Confidential
    </div>
  </div>
</body>
</html>
    `;

    const res = await this.sendEmail({
      to,
      subject: 'Reset Your EVENTRA Account Password',
      html,
    });
    return res.success;
  }

  /**
   * 3. Send Booked Ticket Confirmation Email
   */
  async sendTicketConfirmationEmail(to: string, data: TicketEmailData): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const ticketsHtml = data.tickets
      .map(
        (t, idx) => `
        <div style="background: #1E293B; border: 1px solid #334155; border-radius: 14px; padding: 20px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #FF6A00; text-transform: uppercase;">Ticket #${idx + 1}</span>
              <div style="font-size: 16px; font-weight: 800; color: #FFFFFF;">${t.ticketTypeName}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: #38BDF8;">${t.ticketNumber}</span>
              <div style="font-size: 13px; color: #10B981; font-weight: 700;">₹${t.price.toFixed(2)}</div>
            </div>
          </div>
          <div style="color: #94A3B8; font-size: 13px; margin-bottom: 12px;">Attendee: <strong style="color: #F8FAFC;">${t.attendeeName}</strong></div>
          ${
            t.qrCodeDataUrl
              ? `<div style="text-align: center; padding: 12px; background: #FFFFFF; border-radius: 10px; display: inline-block; margin-top: 8px;">
                   <img src="${t.qrCodeDataUrl}" alt="Ticket QR" width="160" height="160" style="display: block; margin: 0 auto;" />
                   <div style="font-family: monospace; font-size: 10px; color: #0F172A; margin-top: 6px;">Pass Token: ${t.ticketToken.slice(0, 8)}...</div>
                 </div>`
              : `<div style="font-family: monospace; font-size: 12px; color: #38BDF8; background: #0F172A; padding: 8px; border-radius: 6px;">Digital Pass Token: ${t.ticketToken}</div>`
          }
        </div>
      `
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your EVENTRA Tickets - ${data.bookingReference}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #F8FAFC; margin: 0; padding: 24px; }
    .card { max-width: 620px; margin: 0 auto; background: #111827; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .brand { font-size: 24px; font-weight: 800; color: #FF6A00; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
    .event-title { font-size: 24px; font-weight: 800; color: #FFFFFF; margin: 0 0 10px 0; }
    .meta-box { background: #1E293B; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #94A3B8; }
    .meta-item { margin-bottom: 6px; }
    .meta-item strong { color: #F8FAFC; }
    .btn { display: inline-block; background: linear-gradient(135deg, #FF6A00, #FF3D8E); color: #FFFFFF !important; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin: 15px 0; }
    .footer { font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">EVENTRA</div>
    <div style="display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34D399; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">Booking Confirmed</div>
    <h1 class="event-title">${data.eventTitle}</h1>
    
    <div class="meta-box">
      <div class="meta-item"><strong>Booking Reference:</strong> <span style="font-family: monospace; color: #FF6A00;">${data.bookingReference}</span></div>
      <div class="meta-item"><strong>Date & Time:</strong> ${data.eventDate} • ${data.eventTime}</div>
      <div class="meta-item"><strong>Location:</strong> ${data.isOnline ? 'Online / Virtual Stream' : `${data.venueName || 'Venue'}, ${data.city || ''}`}</div>
      <div class="meta-item"><strong>Total Settled:</strong> ₹${data.totalAmount.toFixed(2)}</div>
    </div>

    <h2 style="font-size: 16px; font-weight: 700; color: #F8FAFC; margin: 24px 0 12px 0;">Your Digital QR Passes (${data.tickets.length})</h2>
    ${ticketsHtml}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/tickets" class="btn">Open Pass Wallet in App →</a>
    </div>

    <p style="font-size: 12px; color: #94A3B8; text-align: center; margin-top: 20px;">
      Present this QR pass on your smartphone or print it out at the venue entrance. Each pass is cryptographically validated and admits one person.
    </p>

    <div class="footer">
      EVENTRA Digital Passes • Instant Gate Scanning & Verification
    </div>
  </div>
</body>
</html>
    `;

    const res = await this.sendEmail({
      to,
      subject: `Your EVENTRA Tickets for ${data.eventTitle} (${data.bookingReference})`,
      html,
    });
    return res.success;
  }

  /**
   * 4. Send Event Cancellation Notice to Attendees
   */
  async sendEventCancellationEmail(to: string, attendeeName: string, eventTitle: string, reason?: string): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Event Cancellation Notice - ${eventTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #F8FAFC; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .brand { font-size: 24px; font-weight: 800; color: #FF6A00; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #F87171; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    h1 { color: #FFFFFF; font-size: 22px; margin-top: 0; }
    p { color: #94A3B8; font-size: 14px; line-height: 1.6; }
    .reason-box { background: #1E293B; border-left: 4px solid #EF4444; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #E2E8F0; }
    .footer { font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">EVENTRA</div>
    <div class="status-badge">Event Cancelled</div>
    <h1>Important Update Regarding "${eventTitle}"</h1>
    <p>Dear ${attendeeName},</p>
    <p>We are writing to inform you that the event <strong>"${eventTitle}"</strong> has been cancelled by the organizer.</p>
    
    <div class="reason-box">
      <strong>Organizer's Cancellation Note:</strong><br>
      ${reason || 'No specific cancellation reason was provided by the organizer.'}
    </div>

    <p>Any digital QR passes associated with this event have been voided and will no longer grant entry. Simulated refunds have been credited back to your original payment method in our demo sandbox environment.</p>

    <div class="footer">
      EVENTRA Attendee Care & Notification Operations
    </div>
  </div>
</body>
</html>
    `;

    const res = await this.sendEmail({
      to,
      subject: `Notice: Event "${eventTitle}" has been cancelled`,
      html,
    });
    return res.success;
  }
}

export const emailService = new EmailService();
