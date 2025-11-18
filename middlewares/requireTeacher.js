export function requireTeacher(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.role !== "TEACHER") {
    return res
      .status(403)
      .json({ error: "Only teachers can perform this action" });
  }
  next();
}
