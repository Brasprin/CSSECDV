import express from "express";
import { getAuditsController } from "../controllers/auditController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

// Only admins can fetch audit logs
router.get("/", authenticateJWT, requireAdmin, getAuditsController);

export default router;
