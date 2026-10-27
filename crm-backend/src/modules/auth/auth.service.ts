import { User } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { generateRefreshToken, hashToken, signAccessToken } from "../../utils/jwt";
import { verifyPassword } from "../../utils/password";

const toPublicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

async function issueTokens(user: User) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });
  if (!stored) throw new ApiError(401, "Invalid refresh token");

  // Purana token hamesha delete hota hai (rotation), naya issue hota hai.
  await prisma.refreshToken.deleteMany({ where: { id: stored.id } });
  if (stored.expiresAt < new Date()) throw new ApiError(401, "Refresh token expired");

  return issueTokens(stored.user);
}

export async function logout(refreshToken?: string | null) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
  }
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "User no longer exists");
  return toPublicUser(user);
}