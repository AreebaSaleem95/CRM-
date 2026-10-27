import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { RoleName } from "../types/role";

export function signAccessToken(user: { id: number; role: RoleName }) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: String(user.id),
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): { id: number; role: RoleName } {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  return { id: Number(payload.sub), role: payload.role as RoleName };
}

// Refresh token random string hai, database mein sirf uska hash store hota hai.
export const generateRefreshToken = () => crypto.randomBytes(48).toString("hex");

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");