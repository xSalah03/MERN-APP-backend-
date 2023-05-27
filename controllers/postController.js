const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require('../utils/cloudinary');
const { validateCreatePost, Post, validateUpdatePost } = require('../models/Post');
const { Comment } = require('../models/Comment');

module.exports.createPostCtrl = asyncHandler(async (req, res) => {
    // Validation image
    if (!req.file) {
        return res.status(400).json({ message: 'No image provided' });
    }
    // Validation data
    const { error } = validateCreatePost(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    // Upload photo
    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);
    // Create new post and save it in DB
    const post = await Post.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        user: req.user.id,
        image: {
            url: result.secure_url,
            publicId: result.public_id
        }
    });
    res.status(201).json(post);
    fs.unlinkSync(imagePath);
});

module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
    const POST_PER_PAGE = 3;
    const { pageNumber, category } = req.query;
    let posts;
    if (pageNumber) {
        posts = await Post
            .find()
            .skip((pageNumber - 1) * POST_PER_PAGE)
            .limit(POST_PER_PAGE)
            .sort({ createdAt: - 1 })
            .populate('user', ['-password']);
    } else if (category) {
        posts = await Post
            .find({ category })
            .sort({ createdAt: - 1 })
            .populate('user', ['-password']);
    } else {
        posts = await Post
            .find()
            .sort({ createdAt: - 1 })
            .populate('user', ['-password']);
    }
    res.status(200).json(posts);
});

module.exports.getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
        .populate('user', ['-password'])
        .populate('comments');
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
});

module.exports.getPostCountCtrl = asyncHandler(async (req, res) => {
    const post = await Post.count();
    res.status(200).json(post);
});

module.exports.deletePostCtrl = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    if (req.user.isAdmin || req.user.id === post.user.toString()) {
        await Post.findByIdAndDelete(req.params.id);
        await cloudinaryRemoveImage(post.image.publicId);
        await Comment.deleteMany({ postId: post._id });
        res.status(200).json({ message: 'Post has been deleted successffully', postId: post._id });
    } else {
        res.status(403).json({ message: 'access denied, forbidden' });
    }
});

module.exports.updatePostCtrl = asyncHandler(async (req, res) => {
    // Validation 
    const { error } = validateUpdatePost(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    // Get product from DB and check it if post exist
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    // Check if this post belong to logged in user
    if (req.user.id !== post.user.toString()) {
        return res.status(403).json({ message: 'Access denied, you are not allowed' });
    }
    // Update post
    const updatePost = await Post.findByIdAndUpdate(req.params.id, {
        $set: {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
        }
    }, { new: true })
        .populate('user', ['-password'])
        .populate('comments');
    res.status(200).json(updatePost);
});

module.exports.updatePostImageCtrl = asyncHandler(async (req, res) => {
    // Validation 
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }
    const post = await Post.findById(req.params.id);
    // Get product from DB and check it if post exist
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    // Check if this post belong to logged in user
    if (req.user.id !== post.user.toString()) {
        return res.status(403).json({ message: 'Access denied, you are not allowed' });
    }
    // Delete old image
    await cloudinaryRemoveImage(post.image.publicId);
    // Upload new image
    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);
    // Upload image in DB
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, {
        $set: {
            image: {
                url: result.secure_url,
                publicId: result.public_id,
            }
        }
    }, { new: true });
    // Sending response
    res.status(200).json(updatedPost);
    // Remove image from server
    fs.unlinkSync(imagePath);
});

module.exports.toggleLikeCtrl = asyncHandler(async (req, res) => {
    let post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    const isPostAlreadyLiked = post.likes.find((user) => user.toString() === req.user.id);
    if (isPostAlreadyLiked) {
        post = await Post.findByIdAndUpdate(req.params.id, {
            $pull: { likes: req.user.id }
        }, { new: true })
    } else {
        post = await Post.findByIdAndUpdate(req.params.id, {
            $push: { likes: req.user.id }
        }, { new: true })
    }
    res.status(201).json(post);
});
