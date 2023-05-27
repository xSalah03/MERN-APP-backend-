const mongoose = require('mongoose');
const Joi = require('joi');

const CommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Post',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    text: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Comment = mongoose.model('Comment', CommentSchema);

function validateCreateComment(obj) {
    const schema = Joi.object({
        postId: Joi.string().trim().required(),
        text: Joi.string().trim().required(),
    });
    return schema.validate(obj)
}

function validateUpdateComment(obj) {
    const schema = Joi.object({
        text: Joi.string().trim(),
    });
    return schema.validate(obj)
}

module.exports = {
    Comment, validateCreateComment, validateUpdateComment
};