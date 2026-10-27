import { ApiError } from "./ApiError";

export function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, "Invalid id");
  return id;
}