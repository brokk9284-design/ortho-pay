import { logger } from "@/lib/logger";

async function getAccessToken(): Promise<string | null> {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccountJson || !projectId) {
    logger.warn("Push notifications not configured - missing Firebase env vars");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: expiry,
      iat: now,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const { createSign } = await import("crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(signingInput);
    const signature = sign.sign(serviceAccount.private_key, "base64url");

    const jwt = `${signingInput}.${signature}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      logger.error("Failed to get Firebase OAuth2 token", {});
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  } catch (err) {
    logger.error("Firebase auth failed", {}, err as Error);
    return null;
  }
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessToken = await getAccessToken();
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!accessToken || !projectId) {
    return { success: false, error: "Push notifications not configured" };
  }

  try {
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data || {},
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || "FCM API error" };
    }

    const responseData = await res.json();
    return { success: true, messageId: responseData.name };
  } catch (err) {
    logger.error("Push notification failed", { token }, err as Error);
    return { success: false, error: (err as Error).message };
  }
}

export async function sendBatchPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    tokens.map(async (token) => {
      const result = await sendPushNotification(token, title, body, data);
      if (result.success) sent++;
      else failed++;
    })
  );

  return { sent, failed };
}
