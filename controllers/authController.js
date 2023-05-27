const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { User, validateRegisterUser, validateLoginUser } = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const VerificationToken = require('../models/VerificationToken');

module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
    // validation
    const { error } = validateRegisterUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    // is user already exists
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.status(400).json({ message: 'User already exist' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
    });
    await user.save();
    // Create new verification and save it to DB
    const verificationToken = new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString('hex')
    });
    await verificationToken.save();
    // Making the link
    const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;
    // Putting the link into an html template
    const htmlTemplate = `
    <div>
        <p>Click on the link below to verify your email</p>
        <a href='${link}'>Verify</a>
    </div>`;
    // Sending email to the user
    await sendEmail(user.email, 'Verify your email', htmlTemplate);
    // send a response to client
    res.status(201).json({ message: 'A code was sent to you, please verify your email address' });
});

module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
    // validation
    const { error } = validateLoginUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    // is user already exists
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    };
    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    };
    if (!user.isAccountVerified) {
        let verificationToken = await VerificationToken.findOne({
            userId: user._id,
        });
        if (!verificationToken) {
            verificationToken = new VerificationToken({
                userId: user._id,
                token: crypto.randomBytes(32).toString('hex')
            });
            await verificationToken.save();
            const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;
            const htmlTemplate = `
            <div>
                <p>Click on the link below to verify your email</p>
                <a href='${link}'>Verify</a>
            </div>`;
            await sendEmail(user.email, 'Verify your email', htmlTemplate);
        }
        res.status(400).json({ message: 'A code was sent to you, please verify your email address' });
    }
    const token = user.generateToken();
    res.status(200).json({
        _id: user._id,
        isAdmin: user.isAdmin,
        profilePhoto: user.profilePhoto,
        username: user.username,
        token,
    });
});

module.exports.verifyUserAccountCtrl = asyncHandler(async (req, res) => {
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
    user.isAccountVerified = true;
    await user.save();
    await verificationToken.deleteOne();
    res.status(200).json({ message: 'Your account has been verified' });
});