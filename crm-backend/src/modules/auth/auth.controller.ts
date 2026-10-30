import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";
import { prisma } from "../../lib/prisma";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  res.json(await authService.login(email, password));
});

export const refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req.body.refreshToken));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.json({ message: "Successfully logged out" });
});

export const me = asyncHandler(async (req, res) => {
  res.json(await authService.getMe(req.user!.id));
});

// Update Profile in DB using schema column `avatar`
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { name, role, company, avatar, avatarUrl } = req.body;

  const picture = avatar || avatarUrl;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name ? { name } : {}),
      ...(role ? { role } : {}),
      ...(company ? { company } : {}),
      ...(picture !== undefined ? { avatar: picture } : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      company: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: {
      ...updated,
      company: updated.company || company || "Tech Fusion",
      avatar: updated.avatar || picture || "",
      avatarUrl: updated.avatar || picture || ""
    }
  });
});

// Change Password Handler (English responses)
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters long."
    });
  }

  const result = await authService.changePassword(userId, currentPassword, newPassword);
  res.json(result);
});
// Reset password directly via email
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email and a new password with at least 8 characters.",
    });
  }

  const result = await authService.resetPasswordByEmail(email, newPassword);
  res.json(result);
});
export const register = asyncHandler(async (req, res) => {
  const { name, fullName, email, password } = req.body;
  const userName = name || fullName;

  if (!userName || !email || !password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid name, email, and password (minimum 8 characters).",
    });
  }

  const result = await authService.registerUser(userName, email, password);
  res.status(201).json(result);
});