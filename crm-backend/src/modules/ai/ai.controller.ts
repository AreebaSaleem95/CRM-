import { asyncHandler } from "../../utils/asyncHandler";
import { parseId } from "../../utils/parseId";
import * as aiService from "./ai.service";

export const followUp = asyncHandler(async (req, res) => {
  res.json(await aiService.draftLeadFollowUp(parseId(req.params.id), req.body.tone, req.user!));
});