const nodemailer = require('nodemailer');

module.exports = async (userEmail, subject, htmlTemplate) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.APP_EMAIL_ADDRESS,
                pass: process.env.APP_EMAIL_PASSWORD
            }
        });

        const mailOption = {
            from: process.env.APP_EMAIL_ADDRESS,
            to: userEmail,
            subject: subject,
            html: htmlTemplate
        }

        const info = await transporter.sendMail(mailOption);
        console.log('Email sent: ' + info.response);

    } catch (error) {
       console.log(error);
       throw new Error('Internal Server Error (nodemailer)'); 
    }
}