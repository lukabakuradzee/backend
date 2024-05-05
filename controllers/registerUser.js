const bcrypt = require("bcrypt");
const uuid = require("uuid");
// const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
// const secretKey = require("../crypto/secretKey");
const passwordRegex = require("../utils/regex");
const sendVerificationEmail = require("./sendVerificationEmail");

// // Generate verification Token
// const generateVerificationToken = (email) => {
//   return jwt.sign({ email }, secretKey, { expiresIn: "24h" });
// };

exports.registerUser = async (req, res) => {
  try {
    const { username, name, lastName, age, email, password } = req.body;
    // Check if username exists
    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!passwordRegex.test(password)) {
      return res.status(403).json({
        message:
          "'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character'",
      });
    }

    // generate token
    // const verificationToken = generateVerificationToken(email);
    const verificationToken = uuid.v4();

    // Generate Verification Link
    const verificationLink = `http://localhost:3000/verify-email/${verificationToken}`;

    const resetToken = crypto.randomBytes(20).toString("hex");
    // Set reset token and expiration time
    const resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour

    // Check if all required fields are present in the request body
    if (!username || !email || !password) {
      throw new Error("Missing required fields in request body");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      name,
      lastName,
      age,
      email,
      password: hashedPassword,
      verificationToken,
      resetPasswordToken: resetToken,
      resetPasswordExpires,
    });
    await newUser.save();

    // Send Verification email
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to register user" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params; // Extract token from query parameters
    console.log("Token: ", token);

    const user = await User.findOne({verificationToken: token });
    // Find user by email and update email verification status

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or token invalid" });
    }

    user.emailVerified = true;
    await user.save();


    console.log("Email Verification Success: ", user);
    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to verify Email" });
  }
};
