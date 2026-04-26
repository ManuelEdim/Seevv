const adminMiddleware = (req, res, next) => {
  if (req.user?.profile?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export default adminMiddleware;
