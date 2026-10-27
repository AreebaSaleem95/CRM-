import { asyncHandler } from "../../utils/asyncHandler";
import { parseId } from "../../utils/parseId";
import { ListLeadsQuery } from "./leads.schema";
import * as leadsService from "./leads.service";

export const list = asyncHandler(async (req, res) => {
  res.json(await leadsService.listLeads(req.query as unknown as ListLeadsQuery, req.user!));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await leadsService.createLead(req.body, req.user!));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await leadsService.updateLead(parseId(req.params.id), req.body, req.user!));
});

export const remove = asyncHandler(async (req, res) => {
  res.json(await leadsService.deleteLead(parseId(req.params.id), req.user!));
});