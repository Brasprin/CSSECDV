import express from "express";
import { getAuditsController } from "../controllers/auditController.js";
import { authenticateJWT, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only admins can fetch audit logs
router.get("/", authenticateJWT, requireRole("admin"), getAuditsController);

export default router;
