const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const dotenv = require("dotenv");
const sendVerificationEmail = require("./sendVerificationEmail");
const { sendSmsHandler } = require("../services/twilioServices");
// const redisClient = require('../config/redisClient')

dotenv.config();

exports.loginUser = async (req, res) => {
  try {
    const { identifier, password, resetPassword } = req.body;

    // Validate request body

    if (!identifier || (!resetPassword && !password)) {
      return res
        .status(400)
        .json({ message: "Missing required fields in request body" });
    }

    // Find user by identifier by username || email

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    

    // If resetPassword flag is provided, initiate password reset process
    if (resetPassword) {
      //  Generate password reset token
      const resetToken = crypto.randomBytes(20).toString("hex");
      // Set reset token and expiration time in user document
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
      await user.save();

      // Send password reset instructions to user via email
      const mailOptions = {
        from: "lukabakuradze39@gmail.com",
        to: user.email,
        subject: "Password Reset Instructions",
        html: `<p>You are receiving this email because you (or someone else) has requested the reset of the password for your account.</p>
              <p>Please click on the following link, or paste this into your browser to complete the process:</p>
              <p>https://localhost:3000/reset-password?token=${resetToken}</p>
              <p>Token will be valid for 1 hour.
              <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
      };

      // Send email
      await sendVerificationEmail(mailOptions);

      return res
        .status(200)
        .json({ message: "Password reset instructions sent to your email" });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // user.failedLoginAttempts += 1;
      // await user.save();
    //   if (user.failedLoginAttempts >= 3) {
    //     // const smsResponse = await sendSmsHandler(user.phoneNumber);
    //     // return res.status(401).json({
    //     //   message:
    //     //     `Too many failed login attempts, please verify via OTP sent to your phone ${user.phoneNumber} or`,
    //     //   smsResponse,
    //     // });
    //     return res.status(401).json({ message: "Password is incorrect" });
    //   }
    // }
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Password is incorrect" });
    }
  }
    // user.failedLoginAttempts = 0;
    user.lastLogin = Date.now();
    user.loginCount += 1;
    await user.save();

    const token = jwt.sign(
      {
        userAvatar: user.avatar,
        userId: user.id,
        username: user.username,
        name: user.name,
        lastName: user.lastName,
        age: user.age,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
      },
      process.env.SECRET_KEY,
      { expiresIn: "24h" }
    );


    // Password is correct, return success
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to login" });
  }
};
