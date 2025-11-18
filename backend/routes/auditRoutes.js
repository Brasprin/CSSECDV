import express from "express";
import { getAuditsController } from "../controllers/auditController.js";
import { verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only admins can fetch audit logs
router.get("/", verifyAdmin, getAuditsController);

export default router;
