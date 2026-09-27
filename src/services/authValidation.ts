export type SignupFields = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};
export type FieldErrors = Partial<Record<keyof SignupFields | "login", string>>;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "temp-mail.org",
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "dispostable.com",
  "trashmail.com",
  "yopmail.com",
  "getnada.com",
  "throwawaymail.com",
  "fakemailgenerator.com",
  "maildrop.cc",
  "sharklasers.com",
  "gmx.com.temp",
  "crazymailing.com",
  "tmail.ws",
  "tempmail.net",
  "tmpmail.org",
  "fakeinbox.com",
]);

export function isDisposableEmail(email: string): boolean {
  const parts = normalizeEmail(email).split("@");
  if (parts.length !== 2) return true;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) return false;
  if (isDisposableEmail(normalized)) return false;
  return true;
}

export function validateSignup(fields: SignupFields): FieldErrors {
  const errors: FieldErrors = {};
  const email = normalizeEmail(fields.email);
  if (fields.fullName.trim().length < 2)
    errors.fullName = "Enter your full name.";
  if (!fields.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!isValidEmail(fields.email)) {
    if (isDisposableEmail(fields.email)) {
      errors.email = "Temporary or disposable email addresses are not allowed.";
    } else {
      errors.email = "Enter a valid email address (e.g. name@example.com).";
    }
  }
  if (fields.password.length < 8)
    errors.password = "Use at least 8 characters.";
  else if (!/[A-Za-z]/.test(fields.password) || !/\d/.test(fields.password))
    errors.password = "Use at least one letter and one number.";
  if (fields.confirmPassword !== fields.password)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export function firebaseAuthMessage(
  error: unknown,
  action: "login" | "signup",
) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code === "auth/email-already-in-use")
    return "An account already exists for this email. Log in instead.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/weak-password")
    return "Choose a stronger password with at least 8 characters, including a letter and number.";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  )
    return "The email or password is incorrect.";
  if (code === "auth/network-request-failed")
    return "Check your internet connection and try again.";
  if (code === "auth/account-exists-with-different-credential")
    return "This email already has an IDali account. Log in with that account first, then try this provider again to link it.";
  if (code === "auth/credential-already-in-use")
    return "That social account is already linked to another IDali account.";
  if (
    code === "auth/popup-closed-by-user" ||
    code === "ERR_CANCELED" ||
    code === "ERR_REQUEST_CANCELED"
  )
    return "Authentication was cancelled.";
  if (code === "auth/apple-not-available")
    return "Apple Sign In is available on supported Apple devices only.";
  if (code === "auth/missing-identity-token")
    return "Apple Sign In did not return a valid identity token. Please try again.";
  if (code === "auth/provider-disabled")
    return "This sign-in provider is not enabled in Firebase yet.";
  if (code === "auth/operation-not-allowed")
    return "This sign-in provider is not enabled for IDali yet.";
  if (code === "auth/unauthorized-domain")
    return "This app is not authorized for the configured sign-in domain.";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Please wait a moment and try again.";
  if (code === "auth/invalid-client-id")
    return "The social sign-in configuration is invalid for this build.";
  return action === "signup"
    ? "We could not create your account. Please try again."
    : "We could not log you in. Please try again.";
}
