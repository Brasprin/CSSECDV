// controllers/auditController.js
import { getAuditLogs } from "../helpers/auditHelper.js";

/**
 * GET /api/audits
 * Fetch audit logs with optional type filtering
 * Only accessible by ADMIN
 */
export async function getAuditsController(req, res) {
  try {
    // Ensure only admins can access
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, error: "Access denied: Admins only" });
    }

    // Get logType from query params: SECURITY, ACTION, BOTH
    const { logType = "BOTH" } = req.query;

    const logs = await getAuditLogs({ logType: logType.toUpperCase() });

    return res.status(200).json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch audit logs" });
  }
}
