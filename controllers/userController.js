const asyncHandler = require('express-async-handler');
const { User, validateUpdateUser } = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { cloudinaryUploadImage, cloudinaryRemoveImage, cloudinaryRemoveMultipleImage } = require('../utils/cloudinary');
const { Post } = require('../models/Post');
const { Comment } = require('../models/Comment');

module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Not allowed, only admin' });
    }
    const users = await User.find().select('-password').populate('posts');
    res.status(200).json(users);
});

module.exports.getUserCtrlById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password').populate('posts');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user)
});

module.exports.updateUserCtrl = asyncHandler(async (req, res) => {
    const { error } = validateUpdateUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt)
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, {
        $set: {
            username: req.body.username,
            password: req.body.password,
            bio: req.body.bio,
        }
    }, { new: true })
        .select('-password')
        .populate('posts');
    res.status(200).json(updatedUser);
});

module.exports.getUsersCountCtrl = asyncHandler(async (req, res) => {
    const count = await User.count();
    res.status(200).json(count);
});

module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
    // Validation
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }
    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    // Upload to cloudinary
    const result = await cloudinaryUploadImage(imagePath);
    // Get user from DB
    const user = await User.findById(req.user.id);
    // Delete the old profile photo
    if (user.profilePhoto.publicId !== null) {
        await cloudinaryRemoveImage(user.profilePhoto.publicId);
    }
    // Change the profilePhoto field in the DB
    user.profilePhoto = {
        url: result.secure_url,
        publicId: result.public_id,
    }
    await user.save();
    res.status(200).json({ message: 'Your profile photo uploaded successfully', profilePhoto: { url: result.secure_url, publicId: result.public_id } });
    fs.unlinkSync(imagePath);
});

module.exports.deleteUserCtrl = asyncHandler(async (req, res) => {
    // Get the user from DB
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    // Get all posts from DB
    const posts = await Post.find({ user: user._id });
    // Get public ids from posts
    const publicIds = posts?.map((post) => post.image.publicId);
    // Delete all posts from cloudinary
    if (publicIds?.lenght > 0) {
        await cloudinaryRemoveMultipleImage(publicIds);
    }
    // Delete the profile photo from cloudinary
    if (user.profilePhoto.publicId !== null) {
        await cloudinaryRemoveImage(user.profilePhoto.publicId);
    }
    // Delete user posts and comments
    await Post.deleteMany({ user: user._id });
    await Comment.deleteMany({ user: user._id });
    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    // Send response to the client
    res.status(200).json({ message: 'User has been deleted successfully' });
});