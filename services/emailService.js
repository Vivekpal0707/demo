const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async ({ to, subject, text, html }) => {
  try {
    if (!to) {
      throw new Error("Recipient email (to) is missing");
    }

    await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    return true;
  } catch (error) {
    console.log("Mail Error:", error.message);
    return false;
  }
};

const sendOtpEmail = async (email, otp) => {
  return await sendMail({
    to: email,
    subject: "Your Login OTP",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`
  });
};

const sendResetPasswordEmail = async (email, link) => {
  await transporter.sendMail({
    from: `"My App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <h3>Password Reset</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link is valid for 30 minutes.</p>
    `
  });
};

module.exports = {
  sendMail,
  sendOtpEmail,
  sendResetPasswordEmail
};
