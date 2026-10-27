import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import {
  createContactSchema,
  listContactsQuerySchema,
  updateContactSchema,
} from "./contacts.schema";
import * as controller from "./contacts.controller";

const router = Router();

router.use(authenticate);

router.get("/", validate(listContactsQuerySchema, "query"), controller.list);
// "/cities" ko "/:id" se pehle rakhna zaroori hai, warna "cities" ko id samajh liya jata hai
router.get("/cities", controller.cities);
router.post("/", validate(createContactSchema), controller.create);
router.patch("/:id", validate(updateContactSchema), controller.update);
router.delete("/:id", authorize("admin", "manager"), controller.remove);

export default router;