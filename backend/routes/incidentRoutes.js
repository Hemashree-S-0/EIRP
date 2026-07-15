const express = require("express");
const router = express.Router();
const { listIncidents, createIncident, getIncident, addIncidentComment, getStats, updateStatus, upload } = require("../controllers/incidentController");
const auth = require("../middleware/auth");

router.get("/", listIncidents);
router.get("/stats", getStats);
router.get("/:id", getIncident);
router.post("/", auth(), upload.fields([{ name: "images", maxCount: 5 }, { name: "video", maxCount: 1 }]), createIncident);
router.post("/:id/comments", auth(), addIncidentComment);
router.patch("/:id/status", auth(), updateStatus);

module.exports = router;