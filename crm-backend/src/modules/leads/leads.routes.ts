import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createLeadSchema, listLeadsQuerySchema, updateLeadSchema } from "./leads.schema";
import * as controller from "./leads.controller";

const router = Router();

router.use(authenticate);

router.get("/", validate(listLeadsQuerySchema, "query"), controller.list);
router.post("/", validate(createLeadSchema), controller.create);
router.patch("/:id", validate(updateLeadSchema), controller.update);
router.delete("/:id", authorize("admin", "manager"), controller.remove);

export default router;