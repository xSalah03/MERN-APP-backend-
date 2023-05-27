const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { User, validateEmail, validateNewPassword } = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const VerificationToken = require('../models/VerificationToken');

module.exports.sendResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
    // Validation
    const { error } = validateEmail(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    // Get user from DB by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).json({ message: 'User with this email address does not exist' })
    }
    // Create verificationToken
    let verificationToken = await VerificationToken.findOne({ userId: user._id, });
    if (!verificationToken) {
        verificationToken = new VerificationToken({
            userId: user._id,
            token: crypto.randomBytes(32).toString('hex')
        });
        await verificationToken.save();
    }

    // Create link
    const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verificationToken.token}`;
    // Create HTML tamplate
    const htmlTemplate = `<a href='${link}'>Click here to resert your password</a>`;
    // Sending email
    await sendEmail(user.email, 'Reset password', htmlTemplate);
    // Response to the client
    res.status(200).json({ message: 'Password rest link sent to your email address, please check your inbox' })
});

module.exports.getResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        return res.status(400).json({ message: 'Invalid link' });
    }
    const verificationToken = await VerificationToken.findOne({
        userId: user._id,
        token: req.params.token
    });
    if (!verificationToken) {
        return res.status(400).json({ message: 'Invalid link' });
    }
    res.status(200).json({ message: 'Valid url' });
});

module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
    const { error } = validateNewPassword(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
        return res.status(400).json({ message: 'Invalid link' })
    }
    const verificationToken = await VerificationToken.findOne({
        userId: user._id,
        token: req.params.token
    });
    if (!verificationToken) {
        return res.status(400).json({ message: 'Invalid link' });
    }
    if (!user.isAdmin) {
        user.isAccountVerified = true;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    user.password = hashedPassword;
    await user.save();
    await verificationToken.deleteOne();
    res.status(200).json({ message: 'Password rest successfully, please login' });
});