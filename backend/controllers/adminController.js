const { pool } = require("../config/db");

async function dashboardStats(_req, res, next) {
  try {
    const [[totalCitizens]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'citizen'");
    const [[totalOfficers]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'officer'");
    const [[totalIncidents]] = await pool.query("SELECT COUNT(*) AS total FROM incidents");
    const [[resolvedIncidents]] = await pool.query("SELECT COUNT(*) AS total FROM incidents WHERE status = 'resolved'");
    const [[pendingIncidents]] = await pool.query("SELECT COUNT(*) AS total FROM incidents WHERE status IN ('submitted','investigating')");

    res.json({
      totalUsers: totalCitizens.total,
      totalOfficers: totalOfficers.total,
      totalIncidents: totalIncidents.total,
      resolvedIncidents: resolvedIncidents.total,
      pendingIncidents: pendingIncidents.total
    });
  } catch (error) {
    next(error);
  }
}

async function listUsers(_req, res, next) {
  try {
    const [users] = await pool.query("SELECT id, full_name, email, role, created_at FROM users");
    res.json(users.map((user) => ({ id: user.id, fullName: user.full_name, email: user.email, role: user.role, createdAt: user.created_at })));
  } catch (error) {
    next(error);
  }
}

async function listOfficers(_req, res, next) {
  try {
    const [officers] = await pool.query("SELECT id, full_name, email, created_at FROM users WHERE role = 'officer'");
    res.json(officers.map((user) => ({ id: user.id, fullName: user.full_name, email: user.email, createdAt: user.created_at })));
  } catch (error) {
    next(error);
  }
}

module.exports = { dashboardStats, listUsers, listOfficers };
