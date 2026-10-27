import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate =
  (schema: ZodTypeAny, source: "body" | "query" = "body"): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join(", ");
      return next(new ApiError(400, message));
    }
    (req as any)[source] = result.data;
    next();
  };