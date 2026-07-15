const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { pool } = require("../config/db");

router.get("/me", auth(), async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, full_name, email, role, created_at FROM users WHERE id = ?", [req.user.id]);
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = rows[0];
    res.json({ id: user.id, fullName: user.full_name, email: user.email, role: user.role, createdAt: user.created_at });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
