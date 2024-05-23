const User = require("../models/User");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lukabakuradze39@gmail.com",
    pass: process.env.GMAIL_KEY,
  },
});

exports.deleteUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const email = user.email;

    await User.findOneAndDelete(userId)

    const mailOptions = {
      from: "lukabakuradze39@gmail.com",
      to: email,
      subject: "Your account has been deleted",
      html: `<p>You are receiving this email because you (or someone else) has deleted your account.`,
    };
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error while deleting", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
