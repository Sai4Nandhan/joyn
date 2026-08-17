import nodemailer from 'nodemailer';
import https from 'https';
import dns from 'dns';
import { Resend } from 'resend';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { sendWhatsAppOtp } from './whatsapp.service.js';

// Force Node.js to resolve IPv4 addresses first to prevent ENETUNREACH IPv6 failures on cloud hosts (e.g. Render)
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignore
}

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
}

export async function sendEmailOtp(emailAddress, otpCode) {
  const isDev = env.nodeEnv === 'development';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #7c3aed; margin-bottom: 10px;">JOYN Verification Code</h2>
      <p style="color: #475569; font-size: 14px;">Your 6-digit verification code to complete your registration is:</p>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; margin: 20px 0; border-radius: 8px;">
        ${otpCode}
      </div>
      <p style="color: #64748b; font-size: 12px;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
    </div>
  `;

  // 1. PRIMARY PRODUCTION DISPATCH: Resend HTTPS REST API (Port 443 - Never blocked by Render firewall)
  if (env.resend.apiKey) {
    try {
      const resend = new Resend(env.resend.apiKey);
      const fromAddress = env.resend.from || 'JOYN Verification <onboarding@resend.dev>';
      
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: emailAddress,
        subject: `JOYN — Your 6-Digit Verification Code`,
        html: htmlBody,
      });

      if (error) {
        console.error(`❌ [RESEND API DISPATCH ERROR] Email delivery failed for ${emailAddress}:`, error.message || error);
        throw new ApiError(500, `Email delivery failed: ${error.message || 'Resend API error'}`);
      }

      console.log(`[RESEND API DISPATCH SUCCESS] Delivered OTP email to ${emailAddress} (Resend ID: ${data?.id})`);
      return true;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error(`❌ [RESEND EXCEPTION] Error delivering email to ${emailAddress}:`, err.message);
      throw new ApiError(500, `Email delivery failed: ${err.message}`);
    }
  }

  // 2. LOCAL DEVELOPMENT FALLBACK: Direct Nodemailer SMTP / Ethereal Testing
  const smtpUser = env.smtp.user;
  const smtpPass = env.smtp.pass;
  const smtpHost = env.smtp.host || 'smtp.gmail.com';
  const smtpFrom = env.smtp.from || (smtpUser ? `"JOYN Platform" <${smtpUser}>` : '"JOYN Platform" <no-reply@joynapp.com>');

  if (!smtpUser || !smtpPass) {
    if (isDev) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          lookup: customLookup,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        console.log(`[EMAIL DISPATCH] Initialized Ethereal test transporter (${testAccount.user})`);
        const info = await transporter.sendMail({
          from: smtpFrom,
          to: emailAddress,
          subject: `JOYN — Your 6-Digit Verification Code`,
          html: `<p>Your code is <b>${otpCode}</b></p>`,
        });
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        return true;
      } catch (e) {
        console.error('Failed Ethereal test account:', e.message);
      }
    }
    throw new ApiError(500, 'SMTP / Resend Email credentials not configured on backend server. Set RESEND_API_KEY or SMTP_USER / SMTP_PASS in backend/.env.');
  }

  const mailOptions = {
    from: smtpFrom,
    to: emailAddress,
    subject: `JOYN — Your 6-Digit Verification Code`,
    html: htmlBody,
  };

  // Direct Nodemailer transport for local testing
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(env.smtp.port || 465),
      secure: Number(env.smtp.port || 465) === 465,
      family: 4,
      lookup: customLookup,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`[LOCAL SMTP DISPATCH SUCCESS] Delivered OTP email to ${emailAddress} (MsgID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`❌ [LOCAL SMTP DISPATCH ERROR] Failed to deliver email to ${emailAddress}:`, err.message);
    throw new ApiError(500, `Email delivery failed: ${err.message}`);
  }
}

/**
 * Sends a real cellular SMS verification code to the recipient's mobile phone via Fast2SMS / Twilio.
 */
export async function sendSmsOtp(phoneNumber, otpCode) {
  // Try WhatsApp OTP Delivery First
  const isWhatsAppDelivered = await sendWhatsAppOtp(phoneNumber, otpCode);
  if (isWhatsAppDelivered) {
    console.log(`[WHATSAPP DISPATCH SUCCESS] Delivered WhatsApp OTP code to ${phoneNumber}`);
    return true;
  }

  const fast2smsApiKey = process.env.FAST2SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
  const smsText = `Your JOYN verification code is ${otpCode}. Valid for 10 minutes.`;

  if (fast2smsApiKey) {
    // 1. Try Fast2SMS OTP Route
    const payload = JSON.stringify({
      route: 'otp',
      variables_values: otpCode,
      numbers: cleanPhone,
    });

    const result = await new Promise((resolve) => {
      const req = https.request('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsApiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.return === true || parsed.status_code === 200) {
              resolve({ success: true, response: parsed });
            } else {
              resolve({ success: false, message: parsed.message || body });
            }
          } catch (e) {
            resolve({ success: true, response: body });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, message: err.message });
      });

      req.write(payload);
      req.end();
    });

    if (result.success) {
      return true;
    }

    // 2. Fallback to Quick SMS route
    const qPayload = JSON.stringify({
      route: 'q',
      message: smsText,
      language: 'english',
      flash: 0,
      numbers: cleanPhone,
    });

    const qResult = await new Promise((resolve) => {
      const req = https.request('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsApiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(qPayload),
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed.return === true || parsed.status_code === 200);
          } catch (e) {
            resolve(true);
          }
        });
      });

      req.on('error', () => resolve(false));
      req.write(qPayload);
      req.end();
    });

    if (qResult) return true;
  }

  // Option 2: Twilio SMS API
  if (twilioSid && twilioAuthToken && twilioFromNumber) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const postData = new URLSearchParams({
        To: phoneNumber,
        From: twilioFromNumber,
        Body: smsText,
      }).toString();

      return new Promise((resolve) => {
        const req = https.request(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        }, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            resolve(res.statusCode === 200 || res.statusCode === 201);
          });
        });

        req.on('error', () => resolve(false));
        req.write(postData);
        req.end();
      });
    } catch (err) {
      console.error(`❌ [Twilio Gateway Failed]:`, err.message);
    }
  }

  // Strictly check NODE_ENV: Allow console log fallback ONLY in local development
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔑 [DEV ONLY TERMINAL SMS LOG FOR +91 ${cleanPhone}]: ${otpCode}\n`);
    return true;
  }

  // In Staging / Production or when Fast2SMS balance is unverified: Throw clear operational error
  throw new ApiError(402, 'Fast2SMS requires a ₹100 wallet recharge before delivering SMS to mobile numbers. Please use Email Verification or recharge your Fast2SMS account at fast2sms.com.');
}
