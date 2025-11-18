import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Authenticate JWT and attach user to req.user
export async function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in DB
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Check for specific roles
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!allowedRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient permissions" });
    }

    next();
  };
}
