import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "ORTHO-PAY <noreply@ortho-m8.com>";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}

export async function sendWelcomeEmail(email: string, name: string, sivaTag: string) {
  const html = renderTemplate("welcome", { name, sivaTag });
  return sendEmail({ to: email, subject: `Welcome to ORTHO-PAY — $${sivaTag}`, html });
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  const html = renderTemplate("password-reset", { name, resetLink });
  return sendEmail({ to: email, subject: "Reset your ORTHO-PAY password", html });
}

export async function send2FACodeEmail(email: string, name: string, code: string, purpose: string) {
  const html = renderTemplate("2fa-code", { name, code, purpose });
  return sendEmail({ to: email, subject: `Your ORTHO-PAY verification code: ${code}`, html });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  receiverTag: string,
  reference: string
) {
  const html = renderTemplate("payment-confirmation", { name, amount: amount.toFixed(2), receiverTag, reference });
  return sendEmail({ to: email, subject: `Payment of $${amount.toFixed(2)} to $${receiverTag} is in escrow`, html });
}

export async function sendPaymentRequestEmail(
  email: string,
  name: string,
  requesterTag: string,
  requesterName: string,
  amount: number,
  methodName: string
) {
  const html = renderTemplate("payment-request", { name, requesterTag, requesterName, amount: amount.toFixed(2), methodName });
  return sendEmail({ to: email, subject: `${requesterName} ($${requesterTag}) is requesting $${amount.toFixed(2)}`, html });
}

export async function sendEscrowStatusEmail(
  email: string,
  name: string,
  amount: number,
  counterpartyTag: string,
  status: "approved" | "rejected",
  direction: "sent" | "received"
) {
  const html = renderTemplate("escrow-status", { name, amount: amount.toFixed(2), counterpartyTag, status, direction });
  const subject =
    status === "approved"
      ? direction === "sent"
        ? `Your payment to $${counterpartyTag} was approved`
        : `Payment from $${counterpartyTag} was approved — $${amount.toFixed(2)} received`
      : `Your payment to $${counterpartyTag} was rejected`;
  return sendEmail({ to: email, subject, html });
}

function renderTemplate(type: string, vars: Record<string, string>): string {
  const templates: Record<string, (v: Record<string, string>) => string> = {
    welcome: (v) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0d1117;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px">ORTHO-PAY</h1>
          <p style="margin:4px 0 0;color:#8b949e;font-size:13px">Escrow payments, secured.</p>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0d1117;font-size:20px">Welcome to ORTHO-PAY, ${v.name}</h2>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Your account is ready. You can now send and receive escrow-secured payments with your unique SIVA tag:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr><td style="background:#f4f4f5;border-radius:8px;padding:20px;text-align:center">
              <span style="font-size:28px;font-weight:700;color:#0d1117;letter-spacing:0.5px">$${v.sivaTag}</span>
            </td></tr>
          </table>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Share your tag with anyone to receive payments. All transactions are protected by our escrow model — funds are held safely until admin approval.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr><td style="background:#0d1117;border-radius:8px;padding:14px 24px;text-align:center">
              <a href="https://ortho-pay.app" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">Open ORTHO-PAY</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;color:#8b949e;font-size:12px;border-top:1px solid #e4e4e7;padding-top:20px">If you didn't create this account, please ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,

    "password-reset": (v) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0d1117;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px">ORTHO-PAY</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0d1117;font-size:20px">Reset your password</h2>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Hi ${v.name}, we received a request to reset your ORTHO-PAY password. Click the button below to choose a new password:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr><td style="background:#0d1117;border-radius:8px;padding:14px 24px;text-align:center">
              <a href="${v.resetLink}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">Reset Password</a>
            </td></tr>
          </table>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin:0 0 16px;color:#58a6ff;font-size:13px;word-break:break-all">${v.resetLink}</p>
          <p style="margin:24px 0 0;color:#8b949e;font-size:12px;border-top:1px solid #e4e4e7;padding-top:20px">This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact support.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,

    "2fa-code": (v) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0d1117;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px">ORTHO-PAY</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0d1117;font-size:20px">Your verification code</h2>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Hi ${v.name}, use the code below to ${v.purpose}. This code is valid for 10 minutes.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr><td style="background:#f4f4f5;border-radius:8px;padding:24px;text-align:center">
              <span style="font-size:36px;font-weight:700;color:#0d1117;letter-spacing:8px;font-family:'SF Mono','Fira Code','Consolas',monospace">${v.code}</span>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;color:#8b949e;font-size:12px;border-top:1px solid #e4e4e7;padding-top:20px">Never share this code with anyone. ORTHO-PAY will never ask for your code. If you didn't request this, please contact support immediately.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,

    "payment-confirmation": (v) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0d1117;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px">ORTHO-PAY</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0d1117;font-size:20px">Payment in escrow</h2>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Hi ${v.name}, your payment is now held in escrow and pending admin review.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e4e4e7;border-radius:8px">
            <tr><td style="padding:12px 20px;border-bottom:1px solid #e4e4e7"><span style="color:#8b949e;font-size:13px">Amount</span><br><span style="color:#0d1117;font-size:18px;font-weight:600">$${v.amount}</span></td></tr>
            <tr><td style="padding:12px 20px;border-bottom:1px solid #e4e4e7"><span style="color:#8b949e;font-size:13px">To</span><br><span style="color:#0d1117;font-size:15px;font-weight:500">$${v.receiverTag}</span></td></tr>
            <tr><td style="padding:12px 20px"><span style="color:#8b949e;font-size:13px">Reference</span><br><span style="color:#0d1117;font-size:13px;font-family:monospace">${v.reference}</span></td></tr>
          </table>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">The receiver will be credited once the admin approves the transaction. You'll be notified by email and in the app when the status changes.</p>
          <p style="margin:24px 0 0;color:#8b949e;font-size:12px;border-top:1px solid #e4e4e7;padding-top:20px">You can track this payment in the Activity tab of your ORTHO-PAY app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,

    "payment-request": (v) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0d1117;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px">ORTHO-PAY</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0d1117;font-size:20px">${v.requesterName} is requesting payment</h2>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Hi ${v.name}, ${v.requesterName} ($${v.requesterTag}) is requesting $${v.amount} from you via ${v.methodName}.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e4e4e7;border-radius:8px">
            <tr><td style="padding:12px 20px;border-bottom:1px solid #e4e4e7"><span style="color:#8b949e;font-size:13px">From</span><br><span style="color:#0d1117;font-size:15px;font-weight:500">${v.requesterName} ($${v.requesterTag})</span></td></tr>
            <tr><td style="padding:12px 20px;border-bottom:1px solid #e4e4e7"><span style="color:#8b949e;font-size:13px">Amount</span><br><span style="color:#0d1117;font-size:18px;font-weight:600">$${v.amount}</span></td></tr>
            <tr><td style="padding:12px 20px"><span style="color:#8b949e;font-size:13px">Payment Method</span><br><span style="color:#0d1117;font-size:15px">${v.methodName}</span></td></tr>
          </table>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Open the ORTHO-PAY app to review and complete this payment request. The payment will be held in escrow once you initiate it.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr><td style="background:#0d1117;border-radius:8px;padding:14px 24px;text-align:center">
              <a href="https://ortho-pay.app" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">Open ORTHO-PAY</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;color:#8b949e;font-size:12px;border-top:1px solid #e4e4e7;padding-top:20px">If you don't recognize this request, please ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,

    "escrow-status": (v) => {
      const approved = v.status === "approved";
      const sent = v.direction === "sent";
      const title = approved
        ? sent
          ? "Payment approved"
          : "Payment received"
        : "Payment rejected";
      const message = approved
        ? sent
          ? `Your payment of $${v.amount} to $${v.counterpartyTag} has been approved by ORTHO-PAY admin. The receiver has been credited.`
          : `A payment of $${v.amount} from $${v.counterpartyTag} has been approved. The funds are now in your wallet.`
        : `Your payment of $${v.amount} to $${v.counterpartyTag} was rejected by ORTHO-PAY admin. The held funds have been refunded to your wallet.`;
      const bannerColor = approved ? "#3fb950" : "#f85149";
      return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0d1117;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px">ORTHO-PAY</h1>
        </td></tr>
        <tr><td style="padding:0"><div style="height:4px;background:${bannerColor}"></div></td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 16px;color:#0d1117;font-size:20px">${title}</h2>
          <p style="margin:0 0 16px;color:#3d3d3d;font-size:15px;line-height:1.6">Hi ${v.name}, ${message}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e4e4e7;border-radius:8px">
            <tr><td style="padding:12px 20px;border-bottom:1px solid #e4e4e7"><span style="color:#8b949e;font-size:13px">Amount</span><br><span style="color:#0d1117;font-size:18px;font-weight:600">$${v.amount}</span></td></tr>
            <tr><td style="padding:12px 20px;border-bottom:1px solid #e4e4e7"><span style="color:#8b949e;font-size:13px">${sent ? "To" : "From"}</span><br><span style="color:#0d1117;font-size:15px;font-weight:500">$${v.counterpartyTag}</span></td></tr>
            <tr><td style="padding:12px 20px"><span style="color:#8b949e;font-size:13px">Status</span><br><span style="color:${bannerColor};font-size:15px;font-weight:600;text-transform:capitalize">${v.status}</span></td></tr>
          </table>
          <p style="margin:24px 0 0;color:#8b949e;font-size:12px;border-top:1px solid #e4e4e7;padding-top:20px">View full details in the ORTHO-PAY app under Activity.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    },
  };

  const template = templates[type];
  if (!template) {
    console.error(`[email] Unknown template: ${type}`);
    return "";
  }
  return template(vars);
}
