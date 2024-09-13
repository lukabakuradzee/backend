const passport = require("passport");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
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
  console.log("GOOGLE TOKEN: ", token)

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    

    const payload = ticket.getPayload();
    console.log("PAYLOAD: ", payload)
    const { sub, email, name, picture, age, phoneNumber } = payload;
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
        });

        await user.save();

        accountSettingsLink = `https://localhost:3000/accounts/${user.username}/edit`;

        accountSettingsLink = `https://localhost:3000/accounts/${user.username}/edit`;

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
              <a href="${accountSettingsLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">Change Password</a>
              <p style="margin-top: 20px;">If you did not create an account, please ignore this email.</p>
            </div>
          </div>
        `,
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
        phone: user.phoneNumber,
        emailVerified: user.emailVerified,
      },
      process.env.SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.status(200).json({ success: true, token: jwtToken, user });
    console.log("JWT TOKEN: ", jwtToken);
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
