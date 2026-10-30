import { asyncHandler } from "../../utils/asyncHandler";
import { getDashboard, searchGlobal, getNotifications } from "./dashboard.service";

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await getDashboard(req.user!));
});

export const search = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "");
  // Strictly pass req.user! taaki search results user ke role ke mutabiq filter hon
  res.json(await searchGlobal(query, req.user!));
});

export const notifications = asyncHandler(async (req, res) => {
  res.json(await getNotifications(req.user!));
});