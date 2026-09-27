import { ActionCodeSettings, sendEmailVerification, User } from "firebase/auth";

/**
 * Returns Firebase ActionCodeSettings configured with deep-link/redirect back to IDali login.
 */
export function getActionCodeSettings(): ActionCodeSettings {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:8081";

  return {
    url: `${origin}/verify-email`,
    handleCodeInApp: true,
  };
}

/**
 * Generates the official branded HTML email template for IDali verification.
 * Rendered for mobile and desktop email clients.
 */
export function generateIDaliVerificationEmailHtml(
  userName: string,
  verificationLink: string,
): string {
  const name = userName?.trim() || "User";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your IDali Email Address</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f8;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #ffffff;
      padding: 32px 40px 24px 40px;
      text-align: center;
      border-bottom: 1px solid #f3f4f6;
    }
    .brand-name {
      color: #3b74f6;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .content {
      padding: 36px 40px 32px 40px;
      color: #111827;
      line-height: 1.6;
    }
    .heading {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 16px;
      text-align: center;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }
    .body-text {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .btn-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .verify-btn {
      display: inline-block;
      background-color: #3b74f6;
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 28px;
      box-shadow: 0 4px 12px rgba(59, 116, 246, 0.35);
    }
    .security-card {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 24px;
    }
    .security-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e40af;
      margin: 0 0 4px 0;
    }
    .security-text {
      font-size: 13px;
      color: #1d4ed8;
      margin: 0;
    }
    .fallback-box {
      margin-top: 28px;
      padding: 16px;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
    }
    .fallback-link {
      color: #3b74f6;
      text-decoration: underline;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 40px;
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
      border-top: 1px solid #f3f4f6;
      line-height: 1.5;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-name">IDali</h1>
      </div>
      <div class="content">
        <h2 class="heading">Verify Your Email Address</h2>
        <div class="greeting">Hello ${name},</div>
        <p class="body-text">
          Thank you for signing up for an IDali account. Before you can access your account and start creating photo IDs, please verify your email address.
        </p>
        <div class="btn-wrapper">
          <a href="${verificationLink}" class="verify-btn" target="_blank">Verify My Email</a>
        </div>
        <div class="security-card">
          <div class="security-title">Security Notice</div>
          <div class="security-text">
            This verification link is secured by Firebase Authentication. If you did not create an IDali account, you can safely ignore this email.
          </div>
        </div>
        <div class="fallback-box">
          If the button above does not work, copy and paste this link into your web browser:<br>
          <a href="${verificationLink}" class="fallback-link">${verificationLink}</a>
        </div>
      </div>
      <div class="footer">
        &copy; 2026 IDali. All rights reserved.<br>
        Your photo ID, made simple.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends Firebase email verification using Firebase Auth email service.
 */
export async function sendBrandedVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user);
    console.log("Firebase verification email sent successfully to", user.email);
  } catch (err) {
    console.error("Firebase sendEmailVerification error:", err);
    throw err;
  }
}
