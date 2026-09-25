

const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

const sendResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const result = await brevo.transactionalEmails.sendTransacEmail({
        sender: {
            name: "Car Rental App",
            email: "danielogbushike@gmail.com"
        },
        to: [
            {
                email: email
            }
        ],
        subject: "Reset your password",
        htmlContent: `
            <h2>Reset your password</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link expires in 15 minutes.</p>
        `
    });

    console.log("Brevo email sent:", result.messageId);
};

module.exports = sendResetEmail;