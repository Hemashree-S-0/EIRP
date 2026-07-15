const express = require("express");
const router = express.Router();
const { register, login, profile, resetPassword } = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/profile", auth(), profile);

module.exports = router;
