const passport = require("passport");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const secretKey = require("../crypto/secretKey");
const uuid = require("uuid");
const { generateRandomPassword } = require("../utils/generateRandomPassword");
const sendVerificationEmail = require("./sendVerificationEmail");

dotenv.config();

exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

exports.googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "/",
});

exports.authSuccess = (req, res) => {
  res.redirect("/profile");
};

exports.authLogout = (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
};

exports.getProfile = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.send(
    `<h1>Profile Page</h1><pre>${JSON.stringify(
      req.user,
      null,
      2
    )}</pre><a href="/logout">Logout</a>`
  );
};

exports.verifyGoogleToken = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;
    let user = await User.findOne({ googleId: sub });

    const verificationToken = uuid.v4();
    const verificationLink = `https://localhost:3000/verify-email/${verificationToken}`;
    let accountSettingsLink = "";

    // First, try to find a user by googleId

    if (!user) {
      // If no user with this googleId, try to find by email
      user = await User.findOne({ email });

      if (user) {
        // If a user exists with this email, update their record to include googleId
        user.googleId = sub;
        await user.save();
      } else {
        // If no user exists with this email, create a new user
        const [firstName, lastName] = name.split(" ");
        user = new User({
          googleId: sub,
          email: email,
          name: firstName || "",
          lastName: lastName || "Unknown",
          avatar: picture,
          password: generateRandomPassword(),
          verificationToken: verificationToken,
          username: email.split("@")[0],
          age: 0,
        });

        await user.save();

        accountSettingsLink = `https://localhost:3000/accounts/${user.username}/edit`;

        accountSettingsLink = `https://localhost:3000/accounts/${user.username}/edit`;

        const mailOptions = {
          from: "lukabakuradze39@gmail.com",
          to: email,
          subject: "Email Verification",
          text: `Please click on the following link to verify your email: ${verificationLink}, and please go to account settings click on the following link, it redirects to your account settings to change your password: ${accountSettingsLink}`,
        };
        await sendVerificationEmail(mailOptions);
      }
    } else {
      accountSettingsLink = `https://localhost:3000/accounts/${user.username}/edit`;
    }

    const jwtToken = jwt.sign(
      {
        userAvatar: user.avatar,
        userId: user.id,
        username: user.username,
        name: user.name,
        lastName: user.lastName,
        age: user.age,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      secretKey,
      { expiresIn: "24h" }
    );

    res.status(200).json({ success: true, token: jwtToken, user });
    console.log("JWT TOKEN: ", jwtToken);
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
