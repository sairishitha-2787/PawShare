const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendCheckInReminder(toEmail, adopterName, animalLabel) {
  const info = await transporter.sendMail({
    from: `"PawShare" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Reminder: ${animalLabel} check-in is due`,
    text: `Hi ${adopterName},\n\nThis is a friendly reminder that your ${animalLabel} check-in is due. Please log in to PawShare to complete it.\n\n- The PawShare Team`,
  });

  return info;
}

module.exports = { sendCheckInReminder };