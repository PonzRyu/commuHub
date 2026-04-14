import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

function safeAdminReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/admin")) return "/admin";
  if (raw.startsWith("//")) return "/admin";
  if (raw === "/admin/login") return "/admin";
  return raw;
}

const COOKIE_NAME = "commuhub_admin";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24; // 24h

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET が設定されていません。");
  }
  return secret;
}

function encodePayload(exp: number): string {
  return Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("hex");
}

export function createAdminSessionCookieValue(): string {
  const exp = Date.now() + COOKIE_MAX_AGE_SEC * 1000;
  const payloadB64 = encodePayload(exp);
  const sig = signPayload(payloadB64, getSessionSecret());
  return `${payloadB64}.${sig}`;
}

export function parseAdminSessionCookieValue(
  value: string | undefined,
): boolean {
  if (!value) return false;
  const [payloadB64, sig] = value.split(".");
  if (!payloadB64 || !sig || sig.length !== 64) return false;
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return false;
  }
  const expected = signPayload(payloadB64, secret);
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return false;
    }
  } catch {
    return false;
  }
  let exp: number;
  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    if (typeof parsed.exp !== "number") return false;
    exp = parsed.exp;
  } catch {
    return false;
  }
  return Date.now() < exp;
}

export async function isAdminSessionValid(): Promise<boolean> {
  const jar = await cookies();
  return parseAdminSessionCookieValue(jar.get(COOKIE_NAME)?.value);
}

export async function setAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createAdminSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COMMUHUB_ELECTRON !== "1",
    maxAge: COOKIE_MAX_AGE_SEC,
    path: "/",
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COMMUHUB_ELECTRON !== "1",
    maxAge: 0,
    path: "/",
  });
}

export async function assertAdminSession(): Promise<void> {
  if (!(await isAdminSessionValid())) {
    const h = await headers();
    const next = safeAdminReturnPath(h.get("x-pathname"));
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
}
