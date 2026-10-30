import { User } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { generateRefreshToken, hashToken, signAccessToken } from "../../utils/jwt";
import { verifyPassword, hashPassword } from "../../utils/password";

const toPublicUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  company: u.company || "Tech Fusion",
  avatar: u.avatar || "",
  avatarUrl: u.avatar || "",
});

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

// Database password change with standard English messages
export async function changePassword(userId: number, currentPass: string, newPass: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  const isMatch = await verifyPassword(currentPass, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(400, "Current password does not match");
  }

  const newPasswordHash = await hashPassword(newPass);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return { 
    success: true, 
    message: "Password has been successfully updated in database!" 
  };
}
export async function resetPasswordByEmail(email: string, newPass: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new ApiError(404, "No account found with this email address.");
  }

  const newPasswordHash = await hashPassword(newPass);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  return {
    success: true,
    message: "Password has been successfully reset! You can now sign in.",
  };
}
export async function registerUser(name: string, email: string, pass: string) {
  const cleanEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    throw new ApiError(400, "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(pass);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: "sales",
      company: "Tech Fusion",
    },
  });

  return {
    success: true,
    message: "Account created successfully! Please sign in.",
    user: toPublicUser(newUser),
  };
}