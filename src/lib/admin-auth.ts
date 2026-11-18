import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "kayal_admin_session";
const SESSION_DURATION_HOURS = 12;

export interface AdminSession {
  username: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
}

function getSessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SERVER_AUTH_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "kayal-samayal-default-secret-change-in-prod";
  return secret.trim();
}

export function getGasAdminToken(): string {
  const token =
    process.env.SERVER_AUTH_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "";
  return token.trim();
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const configuredUser = (process.env.ADMIN_USERNAME || "admin").trim();
  const configuredPass = (process.env.ADMIN_PASSWORD || "admin@kayal2026").trim();

  const userMatch = crypto.timingSafeEqual(
    Buffer.from(username.trim().padEnd(64)),
    Buffer.from(configuredUser.padEnd(64))
  );

  const passMatch = crypto.timingSafeEqual(
    Buffer.from(password.trim().padEnd(64)),
    Buffer.from(configuredPass.padEnd(64))
  );

  return userMatch && passMatch;
}

export function createSessionToken(username: string): string {
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_HOURS * 60 * 60 * 1000;
  const payload = JSON.stringify({
    username: username.trim(),
    role: "admin",
    issuedAt: now,
    expiresAt,
  });

  const b64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(b64Payload)
    .digest("base64url");

  return `${b64Payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): AdminSession | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [b64Payload, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(b64Payload)
    .digest("base64url");

  if (
    signature.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    return null;
  }

  try {
    const raw = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed || parsed.role !== "admin" || !parsed.expiresAt) {
      return null;
    }
    if (Date.now() > parsed.expiresAt) {
      return null; // Expired
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(res: NextResponse, token: string): void {
  const maxAge = SESSION_DURATION_HOURS * 60 * 60;
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearAdminSessionCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
