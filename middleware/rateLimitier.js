const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const sendVerificationEmail = require("../controllers/sendVerificationEmail");

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  handler: async (req, res) => {
    const { identifier } = req.body;
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });


    if (user) {
      const mailOptions = {
        from: "lukabakuradze39@gmail.com",
        to: user.email,
        subject: "Suspicious Login Attempts",
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
              <img src="https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTebPMTK7aGkNZvnM-oiKB8lYC38YGPWG8KrzEB6-9z_mgThEpb" alt="Logo" style="max-width: 150px; margin-bottom: 20px; border-radius: 200px;">
              <p>There have been multiple unsuccessful login attempts to your account. 
              If this wasn't you, please change your password immediately.</p>
              <p>If this was you, please wait 5 minutes and try again, or login with OTP</p>,
            </div>
          </div>
          `,
      };
      await sendVerificationEmail(mailOptions);
    }

    res.status(429).json({
      message:
        "Too many uneccessful login attempts from this IP, please try again after 5 minutes",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
