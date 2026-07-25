import { logger } from "@/lib/logger";

export async function sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    logger.warn("SMS not configured - missing Twilio env vars");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: message,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || "Twilio API error" };
    }

    const data = await res.json();
    return { success: true, messageId: data.sid };
  } catch (err) {
    logger.error("SMS send failed", { to }, err as Error);
    return { success: false, error: (err as Error).message };
  }
}

export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  const result = await sendSms(to, `Your ORTHO-PAY verification code is: ${code}. It expires in 10 minutes.`);
  return result.success;
}
