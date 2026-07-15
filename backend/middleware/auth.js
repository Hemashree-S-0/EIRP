const { verifyToken } = require("../utils/jwt");

function auth(requiredRole = null) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = verifyToken(token);
      req.user = payload;

      if (requiredRole && payload.role !== requiredRole && payload.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

module.exports = auth;
