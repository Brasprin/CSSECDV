// routes/auditRouter.js
import express from "express";
import { getAuditsController } from "../controllers/auditController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

// ----------------------
// GET AUDIT LOGS (Admins only)
// ----------------------

router.get("/", requireAuth, requireAdmin, getAuditsController);

export default router;
