const dotenv = require("dotenv");
const twilio = require("twilio");

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSms = async (to) => {
  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: to,
        channel: "sms",
      });
    return verification;
  } catch (error) {
    throw new Error(error.message);
  }
};

const verifySms = async (to, code) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: to,
        code: code,
      });
    return verificationCheck;
  } catch (error) {
    throw new Error(error.message);
  }
};

const sendSmsHandler = async (phoneNumber) => {
  try {
    const sms = await sendSms(phoneNumber);
    console.log(`SMS sent successfully: ${JSON.stringify(sms)}`);
    res.status(200).json({
      success: true,
      sms,
      message: "Verification code was send successfully",
    });
  } catch (error) {
    console.error(`Error sending SMS: ${error.message}`);
  }
};

const verificationCodeHandler = async (req, res) => {
  const { to, code } = req.body;
  console.log(`Verifying sms for: to=${to}, code=${code}`)
  if (!to || !code) {
    return res
      .status(400)
      .json({ success: false, message: "'to' and 'code' are required fields" });
  }
  try {
    const verifyCodeCheck = await verifySms(to, code);
    res.status(200).json({
      success: true,
      verifyCodeCheck,
      message: "Sms code verified successfully",
    });
  } catch (error) {
    console.error("Error verifying sms code: ", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendSmsHandler, verificationCodeHandler, verifySms };
