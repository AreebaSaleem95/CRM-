import { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";
import type { RoleName } from "../types/role";

export const authorize =
  (...roles: RoleName[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to do this"));
    }
    next();
  };