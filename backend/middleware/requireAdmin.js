export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, error: "Access denied: Admins only" });
  }
  next();
}
