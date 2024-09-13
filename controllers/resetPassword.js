const User = require("../models/User");
const crypto = require("crypto");
const sendVerificationEmail = require("./sendVerificationEmail");
require("dotenv").config();

exports.resetPassword = async function (req, res) {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with indicated email don't exists" });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    // Set reset token and expiration time in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    const resetPasswordLink = `https://localhost:3000/reset-password/?token=${resetToken}`;
    await user.save();

    // Send password reset instructions to user via email
    const mailOptions = {
      from: "lukabakuradze39@gmail.com",
      to: email,
      subject: "Password Reset Instructions",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
          <img src="https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTebPMTK7aGkNZvnM-oiKB8lYC38YGPWG8KrzEB6-9z_mgThEpb" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
          <h2>Password Reset instructions</h2>
          <p>Please click the button to reset your account password:</p>
          <a href="${resetPasswordLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p style="margin-top: 20px;">Token will be valid for 1 hour.
          <p style="margin-top: 20px;">If you did not request this, please ignore this email and your password will remain unchanged</p>
        </div>
      </div>`,
    };
    
    await sendVerificationEmail(mailOptions);

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
