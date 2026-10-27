import { asyncHandler } from "../../utils/asyncHandler";
import { getDashboard } from "./dashboard.service";

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await getDashboard(req.user!));
});