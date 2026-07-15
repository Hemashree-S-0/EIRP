const { pool } = require("../config/db");
const upload = require("../utils/upload");

async function listIncidents(_req, res, next) {
  try {
    // Support filtering by the role of the user who submitted the incident:
    // e.g. GET /api/incidents?submitterRole=citizen
    const submitterRole = _req.query.submitterRole;
    if (submitterRole) {
      const [rows] = await pool.query(
        `SELECT i.* FROM incidents i
         JOIN users u ON i.submitted_by = u.id
         WHERE u.role = ?
         ORDER BY i.created_at DESC`,
        [submitterRole]
      );
      return res.json(rows);
    }

    const [incidents] = await pool.query("SELECT * FROM incidents ORDER BY created_at DESC");
    res.json(incidents);
  } catch (error) {
    next(error);
  }
}

async function createIncident(req, res, next) {
  try {
    const {
      title,
      category,
      description,
      date,
      time,
      location,
      latitude,
      longitude,
      severity
    } = req.body;

    const submittedBy = req.user?.id || null;
    const [result] = await pool.query(
      "INSERT INTO incidents (title, category, description, incident_date, incident_time, location, latitude, longitude, severity, status, submitted_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [title, category, description, date, time, location, latitude || null, longitude || null, severity, "submitted", submittedBy]
    );

    const incidentId = result.insertId;
    const files = [];

    if (req.files) {
      const imageValues = [];
      const uploadFiles = req.files.images || [];
      const videoFile = req.files.video?.[0];

      uploadFiles.forEach((image) => {
        imageValues.push([incidentId, `uploads/${image.filename}`]);
        files.push({ type: "image", path: `uploads/${image.filename}` });
      });

      if (imageValues.length > 0) {
        await pool.query("INSERT INTO incident_images (incident_id, file_path) VALUES ?", [imageValues]);
      }

      if (videoFile) {
        await pool.query("INSERT INTO incident_images (incident_id, file_path) VALUES (?, ?)", [incidentId, `uploads/${videoFile.filename}`]);
        files.push({ type: "video", path: `uploads/${videoFile.filename}` });
      }
    }

    res.status(201).json({
      message: "Incident submitted successfully",
      incident: { id: incidentId, title, category, description, date, time, location, latitude, longitude, severity, status: "submitted", submittedBy, files }
    });
  } catch (error) {
    next(error);
  }
}

async function getIncident(req, res, next) {
  try {
    const [rows] = await pool.query("SELECT * FROM incidents WHERE id = ?", [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const incident = rows[0];
    const [comments] = await pool.query("SELECT * FROM comments WHERE incident_id = ? ORDER BY created_at DESC", [req.params.id]);
    const [images] = await pool.query("SELECT * FROM incident_images WHERE incident_id = ?", [req.params.id]);

    res.json({ incident, comments, media: images });
  } catch (error) {
    next(error);
  }
}

async function addIncidentComment(req, res, next) {
  try {
    const author = req.user?.email || "System";
    const content = req.body.content;

    const [result] = await pool.query(
      "INSERT INTO comments (incident_id, author, content, created_at) VALUES (?, ?, ?, NOW())",
      [req.params.id, author, content]
    );

    res.status(201).json({
      message: "Comment added",
      comment: { id: result.insertId, incidentId: Number(req.params.id), author, content, createdAt: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
}

async function getStats(_req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total, SUM(status IN ('submitted','investigating')) AS pending, SUM(status = 'resolved') AS resolved, SUM(status = 'rejected') AS rejected FROM incidents"
    );

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['submitted', 'investigating', 'resolved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const [result] = await pool.query('UPDATE incidents SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    res.json({ message: 'Status updated', status });
  } catch (error) {
    next(error);
  }
}

module.exports = { listIncidents, createIncident, getIncident, addIncidentComment, getStats, updateStatus, upload };
