const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // or your email provider
            auth: {
                user: "product.tutorme@gmail.com",
                pass: "wdts ltqs vgzl coyj", 
            },
        });

        const mailOptions = {
            from: "your_email@gmail.com",
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email could not be sent");
    }
};

module.exports = { sendEmail };