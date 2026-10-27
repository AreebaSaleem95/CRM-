import { asyncHandler } from "../../utils/asyncHandler";
import { parseId } from "../../utils/parseId";
import { ListContactsQuery } from "./contacts.schema";
import * as contactsService from "./contacts.service";

export const list = asyncHandler(async (req, res) => {
  res.json(await contactsService.listContacts(req.query as unknown as ListContactsQuery));
});

export const cities = asyncHandler(async (_req, res) => {
  res.json(await contactsService.listCities());
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await contactsService.createContact(req.body, req.user!.id));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await contactsService.updateContact(parseId(req.params.id), req.body, req.user!.id));
});

export const remove = asyncHandler(async (req, res) => {
  res.json(await contactsService.deleteContact(parseId(req.params.id), req.user!.id));
});