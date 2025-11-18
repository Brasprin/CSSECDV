// helpers/auditHelper.js
import Audit from "../models/Audit.js";

export async function logAudit({
  actorId,
  actorRole,
  action,
  entityType,
  entityId = null,
  metadata = {},
  ip = "",
  userAgent = "",
  severity = "INFO",
  status = "SUCCESS",
}) {
  const audit = new Audit({
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    metadata,
    ip,
    userAgent,
    severity,
    status,
  });

  await audit.save();
  return audit;
}

export async function auditHelper({
  req, // Express request object
  action,
  entityType,
  entityId = null,
  metadata = {},
  severity = "INFO",
  status = "SUCCESS",
}) {
  const actorId = req.user?._id || null;
  const actorRole = req.user?.role || "STUDENT"; // default if not authenticated
  const ip = req.ip;
  const userAgent = req.headers["user-agent"] || "";

  // Automatic log categorization
  const logCategory = ["LOGIN", "REGISTER", "PASSWORD", "SECURITY"].some(
    (keyword) => action.toUpperCase().includes(keyword)
  )
    ? "SECURITY"
    : "ACTION";

  return await logAudit({
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    metadata: { ...metadata, category: logCategory },
    ip,
    userAgent,
    severity,
    status,
  });
}

export async function getAuditLogs({ logType = "BOTH" } = {}) {
  let query = {};

  if (logType === "SECURITY") {
    query["metadata.category"] = "SECURITY";
  } else if (logType === "ACTION") {
    query["metadata.category"] = "ACTION";
  }

  return await Audit.find(query).sort({ timestamp: -1 }).limit(500);
}
