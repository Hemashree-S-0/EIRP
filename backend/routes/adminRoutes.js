const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { dashboardStats, listUsers, listOfficers } = require("../controllers/adminController");

router.get("/dashboard", auth("admin"), dashboardStats);
router.get("/users", auth("admin"), listUsers);
router.get("/officers", auth("admin"), listOfficers);

module.exports = router;
