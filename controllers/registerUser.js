const bcrypt = require("bcrypt");
const uuid = require("uuid");
const crypto = require("crypto");
const User = require("../models/User");
const passwordRegex = require("../utils/regex");
const sendVerificationEmail = require("./sendVerificationEmail");


exports.registerUser = async (req, res) => {
  try {
    const { username, name, lastName, age, email, phoneNumber, password } = req.body;
    console.log("Req body register:" , req.body)
    // Check if username exists
    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    const existingPhoneNumber = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if(existingPhoneNumber) {
      return res.status(400).json({message: "Account with this phone number already existed"})
    }

    if (!passwordRegex.test(password)) {
      return res.status(403).json({
        message:
          "'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character'",
      });
    }

    // generate token
    const verificationToken = uuid.v4();

    // Generate Verification Link
    const verificationLink = `https://localhost:3000/verify-email/${verificationToken}`;

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
      phoneNumber,
      password: hashedPassword,
      verificationToken,
      resetPasswordToken: resetToken,
      resetPasswordExpires,
    });
    await newUser.save();

    const mailOptions = {
    from: "lukabakuradze39@gmail.com",
    to: email,
    subject: "Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
          <img src="https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTebPMTK7aGkNZvnM-oiKB8lYC38YGPWG8KrzEB6-9z_mgThEpb" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
          <h2>Email Verification</h2>
          <p>Thank you for creating an account. Please click the button below to verify your email address:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p style="margin-top: 20px;">If you did not create an account, please ignore this email.</p>
        </div>
      </div>
    `,
  };
  
    // Send Verification email
    await sendVerificationEmail(mailOptions, verificationLink);

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to register user" });
  }
};
