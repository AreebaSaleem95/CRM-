import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  res.json(await authService.login(email, password));
});

export const refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req.body.refreshToken));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  res.json(await authService.getMe(req.user!.id));
});