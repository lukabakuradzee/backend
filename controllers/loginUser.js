const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const secretKey = require("../crypto/secretKey");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lukabakuradze39@gmail.com",
    pass: "nomzlhdqzjxxhlms",
  },
});

exports.loginUser = async (req, res) => {
  try {
    const { username, password, resetPassword } = req.body;

    // Check if all required fields are present in the request body
    if (!username || (resetPassword === undefined && !password)) {
      throw new Error("Missing required fields in request body");
    }

    // Find user by username
    const user = await User.findOne({ username });

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
              <p>http://localhost:3000/reset-password?token=${resetToken}</p>
              <p>Token will be valid for 1 hour.
              <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      return res
        .status(200)
        .json({ message: "Password reset instructions sent to your email" });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        name: user.name,
        lastName: user.lastName,
        age: user.age,
        email: user.email,
      },
      secretKey,
      { expiresIn: "24h" }
    );

    // Password is correct, return success
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to login" });
  }
};

exports.resetPassword = async function (req, res) {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User with indicated email don't exists" });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    // Set reset token and expiration time in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send password reset instructions to user via email
    const mailOptions = {
      from: "lukabakuradze39@gmail.com",
      to: email,
      subject: "Password Reset Instructions",
      html: `<p>You are receiving this email because you (or someone else) has requested the reset of the password for your account.</p>
            <p>Please click on the following link, or paste this into your browser to complete the process:</p>
            <p>http://localhost:3000/reset-password?token=${resetToken}</p>
            <p>Token will be valid for 1 hour.
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Password reset instructions sent to your email" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to send password reset instructions" });
  }
};

exports.setNewPassword = async (req, res) => {
  try {
    const { newPassword, resetToken } = req.body;
    const user = await User.findOne({ resetPasswordToken: resetToken });


    // If no user is found with the given reset token or token has expired
    if (!user || user.resetPasswordExpires < Date.now()) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to rest password" });
  }
};
