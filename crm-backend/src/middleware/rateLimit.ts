import { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

// Simple in-memory limiter: backend restart par reset ho jata hai, aur sirf ek server process ke liye hai
export function rateLimitPerUser(maxRequests: number, windowMs: number): RequestHandler {
  const hits = new Map<number, number[]>();

  return (req, _res, next) => {
    const key = req.user?.id ?? 0;
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      return next(new ApiError(429, "Too many AI requests. Please wait a minute and try again."));
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}