// controllers/auditController.js
import { getAuditLogs } from "../helpers/auditHelpers.js";
import {
  getUserMetadata,
  getCourseMetadata,
  getGradeMetadata,
  getEnrollmentMetadata,
} from "../helpers/metadataHelpers.js";

export async function getAuditsController(req, res) {
  try {
    const { logType = "BOTH" } = req.query;
    const logs = await getAuditLogs({ logType: logType.toUpperCase() });

    // Enrich logs
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let enrichedLog = typeof log.toObject === "function" ? log.toObject() : { ...log };

        // Actor metadata
        if (log.actorId) {
          const userMeta = await getUserMetadata(log.actorId);
          enrichedLog.actorMeta = userMeta || { id: log.actorId };
        } else if (log.entityType === "USER" && log.entityId) {
          // Fallback: for security events (e.g., LOGIN_SUCCESS) actorId may be null but entityId points to the user
          const userMeta = await getUserMetadata(log.entityId);
          if (userMeta) {
            enrichedLog.actorMeta = userMeta;
          }
        }

        // Entity metadata based on entityType
        switch (log.entityType) {
          case "COURSE":
            if (log.entityId) {
              const courseMeta = await getCourseMetadata(log.entityId);
              enrichedLog.entityMeta = courseMeta || { id: log.entityId };
            }
            break;

          case "GRADE":
            if (log.entityId) {
              const gradeMeta = await getGradeMetadata(log.entityId);
              enrichedLog.entityMeta = gradeMeta || { id: log.entityId };
            }
            break;

          case "ENROLLMENT":
            if (log.entityId) {
              const enrollmentMeta = await getEnrollmentMetadata(log.entityId);
              enrichedLog.entityMeta = enrollmentMeta || { id: log.entityId };
            }
            break;

          // Add more entity types here if needed
          default:
            break;
        }

        return enrichedLog;
      })
    );

    return res.status(200).json({
      success: true,
      logs: enrichedLogs,
      count: enrichedLogs.length,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch audit logs" });
  }
}
