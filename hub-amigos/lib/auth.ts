import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./supabase";
import type { UserRow } from "./types";

const COOKIE_NAME = "hub_session";
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing SESSION_SECRET env var.");
  return new TextEncoder().encode(s);
};

/** Signs a long-lived (180 day) JWT holding the user id and sets it as an httpOnly cookie. Called after a successful login/signup. */
export async function createSessionCookie(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Verifies the session cookie's signature/expiry and pulls the user id out of it, without hitting the DB. */
async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}

/** The logged-in user for this request, or null if there's no valid session. The one DB round-trip auth needs. */
export async function getCurrentUser(): Promise<UserRow | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  const { data } = await db.from("users").select("*").eq("id", uid).maybeSingle();
  return (data as UserRow) ?? null;
}

/** Normalizes a typed name for case/whitespace-insensitive lookup (login, the unique name index, "link this account" matching). */
export const normName = (s: string) => s.trim().toLowerCase();

/** 4-6 digit PIN, as entered on login/setup/reset. */
export const isValidPin = (pin: string) => /^\d{4,6}$/.test(pin);

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash);
}
