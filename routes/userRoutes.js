const express = require("express");
const router = express.Router();
const authMiddleware = require("../middelware/auth");
const { registerUser } = require("../controllers/registerUser");
const {verifyEmail} = require("../controllers/verifyEmail")
const { loginUser } = require("../controllers/loginUser");
const { getUserData } = require("../controllers/userData");
const { updateUserProfile } = require("../controllers/updateUserProfile");
const { logoutUser } = require("../controllers/logoutUser");
const { setNewPassword } = require("../controllers/setNewPassword");
const { resetPassword } = require("../controllers/resetPassword");
const { deleteUser } = require("../controllers/deleteUser");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);
router.post("/set-new-password", setNewPassword);
router.get("/user-data", authMiddleware, getUserData);
router.put("/update-profile/:userId", authMiddleware, updateUserProfile);
router.post("/logout", authMiddleware, logoutUser);
router.delete("/delete/:userId", deleteUser);
router.post("/verify-email/:token", verifyEmail);
router.get("/example", (req, res, next) => {
  const err = new Error("Example Error");
  next(err);
});

module.exports = router;
