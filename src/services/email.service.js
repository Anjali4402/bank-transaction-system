require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend-ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to Backend Ledger!";

  const text = `
Hello ${name},

Thank you for registering with Backend Ledger.

Your account has been created successfully, and you can now start exploring our platform and its features.

If you have any questions or need assistance, feel free to reach out to our support team.

We’re excited to have you with us!

Best Regards,
Backend Ledger Team
`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to Backend Ledger, ${name}! 🎉</h2>

      <p>
        Thank you for registering with <strong>Backend Ledger</strong>.
      </p>

      <p>
        Your account has been created successfully, and you can now start
        exploring our platform and its features.
      </p>

      <p>
        If you have any questions or need assistance, our support team is
        always here to help.
      </p>

      <p>
        We’re excited to have you as part of our community and look forward
        to helping you achieve your goals.
      </p>

      <br />

      <p>
        Best Regards,<br />
        <strong>Backend Ledger Team</strong>
      </p>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendRegistrationEmail,
};
