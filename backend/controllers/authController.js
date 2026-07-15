const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { signToken } = require("../utils/jwt");

async function register(req, res, next) {
  try {
    const { fullName, email, password, role = "citizen" } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
      [fullName, email, passwordHash, role]
    );

    const user = { id: result.insertId, fullName, email, role };
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
}

async function profile(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, createdAt: user.created_at } });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [passwordHash, email]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, profile, resetPassword };
