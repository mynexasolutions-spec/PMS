/**
 * Email service powered by Brevo Transactional Email API.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendVerificationEmail({ toEmail, toName, verificationUrl }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "nexapms@meagle360.com";
  const senderName = process.env.BREVO_SENDER_NAME || "Nexa PMS";

  if (!apiKey) {
    console.error("BREVO_API_KEY is missing in environment variables.");
    throw new Error("Email service is not configured.");
  }

  const recipientName = toName?.trim() || toEmail.split("@")[0];

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Nexa PMS Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1324; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b1324; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #111e38; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px; text-align: left; border-bottom: 1px solid #1e293b;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 36px; height: 36px; border-radius: 10px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: 700; font-size: 18px;">
                    N
                  </td>
                  <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                    Nexa PMS
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h1 style="margin: 0 0 14px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #94a3b8;">
                Hi <strong style="color: #f1f5f9;">${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 24px; color: #cbd5e1;">
                Thank you for signing up for <strong>Nexa PMS</strong>. To activate your account and start managing your workspace, please verify your email address by clicking the button below:
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 34px; border-radius: 10px; letter-spacing: 0.01em; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4);">
                      Verify Email & Activate Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 12px; font-size: 13px; line-height: 20px; color: #64748b;">
                If the button above doesn't work, copy and paste this link into your web browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; line-height: 18px; word-break: break-all; color: #38bdf8;">
                <a href="${verificationUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${verificationUrl}</a>
              </p>

              <div style="background-color: #0b1324; border-left: 3px solid #10b981; border-radius: 6px; padding: 12px 16px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12.5px; line-height: 18px; color: #94a3b8;">
                  ⏱️ <strong>Security note:</strong> This verification link is valid for <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0b1324; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                Sent by <strong>Nexa PMS</strong> · Powered by Meagle360
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                This is an automated system email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: toEmail,
        name: recipientName,
      },
    ],
    subject: "Verify your email for Nexa PMS",
    htmlContent,
  };

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo API error:", response.status, errorText);
    throw new Error(`Failed to send email via Brevo: ${response.statusText} (${errorText})`);
  }

  const result = await response.json();
  return result;
}
