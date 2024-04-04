const express = require('express');
const router = express.Router();
const authMiddleware = require("../middelware/auth");
const { registerUser, verifyEmail } = require('../controllers/registerUser');
const { loginUser, resetPassword, setNewPassword } = require('../controllers/loginUser');
const { getUserData } = require('../controllers/userData');
const { updateUserProfile } = require('../controllers/updateProfile');
const { logoutUser } = require('../controllers/logoutUser');


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);
router.post("/set-new-password", setNewPassword);
router.get("/user-data", authMiddleware, getUserData);
router.put("/update-profile", authMiddleware, updateUserProfile);
router.post("/logout", authMiddleware, logoutUser)
router.post("/verify-email", verifyEmail);


module.exports = router;