import https from 'https';

/**
 * Sends a real WhatsApp OTP verification message directly to the user's mobile phone via WhatsApp.
 * Supports CallMeBot (Free WhatsApp API), Twilio WhatsApp API, and UltraMsg / Meta WhatsApp Cloud API.
 */
export async function sendWhatsAppOtp(phoneNumber, otpCode) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
  const whatsappText = `💬 *JOYN Verification Code*\n\nYour 6-digit verification code is: *${otpCode}*\n\nValid for 10 minutes. Do not share this code with anyone.`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n==================================================`);
    console.log(`💬 [DISPATCHING LIVE WHATSAPP OTP]`);
    console.log(`  To WhatsApp Number: +${fullPhone}`);
    console.log(`  Code: ${otpCode}`);
    console.log(`==================================================\n`);
  } else {
    console.log(`[WHATSAPP DISPATCH] Dispatching OTP to +${fullPhone}`);
  }

  const callMeBotApiKey = process.env.CALLMEBOT_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const ultramsgInstanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const ultramsgToken = process.env.ULTRAMSG_TOKEN;

  // Option 1: CallMeBot Free WhatsApp API
  if (callMeBotApiKey) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=+${fullPhone}&text=${encodeURIComponent(whatsappText)}&apikey=${callMeBotApiKey}`;
      return new Promise((resolve) => {
        https.get(url, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            console.log(`[CallMeBot WhatsApp Response]:`, body);
            resolve(res.statusCode === 200 || body.includes('Message queued'));
          });
        }).on('error', (err) => {
          console.error(`❌ [CallMeBot Error]:`, err.message);
          resolve(false);
        });
      });
    } catch (e) {
      console.error(`❌ Failed to send WhatsApp via CallMeBot:`, e.message);
    }
  }

  // Option 2: UltraMsg WhatsApp API
  if (ultramsgInstanceId && ultramsgToken) {
    try {
      const postData = new URLSearchParams({
        token: ultramsgToken,
        to: `+${fullPhone}`,
        body: whatsappText,
      }).toString();

      return new Promise((resolve) => {
        const req = https.request(`https://api.ultramsg.com/${ultramsgInstanceId}/messages/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        }, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            console.log(`[UltraMsg WhatsApp Response]:`, body);
            resolve(res.statusCode === 200);
          });
        });

        req.on('error', () => resolve(false));
        req.write(postData);
        req.end();
      });
    } catch (e) {
      console.error(`❌ Failed to send WhatsApp via UltraMsg:`, e.message);
    }
  }

  // Option 3: Twilio WhatsApp Sandbox / Production API
  if (twilioSid && twilioAuthToken) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const postData = new URLSearchParams({
        To: `whatsapp:+${fullPhone}`,
        From: twilioWhatsAppFrom,
        Body: whatsappText,
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
            console.log(`[Twilio WhatsApp Response]:`, body);
            resolve(res.statusCode === 200 || res.statusCode === 201);
          });
        });

        req.on('error', () => resolve(false));
        req.write(postData);
        req.end();
      });
    } catch (e) {
      console.error(`❌ Failed to send WhatsApp via Twilio:`, e.message);
    }
  }

  // Fallback for Development Mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n💬 [DEV MODE WHATSAPP OTP CODE FOR +${fullPhone}]: ${otpCode}\n`);
    return true;
  }

  return false;
}
