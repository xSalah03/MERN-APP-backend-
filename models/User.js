const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const passwordComplexity = require('joi-password-complexity');

// User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
    },
    profilePhoto: {
        type: Object,
        default: {
            url: 'https://i.pinimg.com/474x/76/4d/59/764d59d32f61f0f91dec8c442ab052c5.jpg',
            publicId: null,
        }
    },
    bio: {
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isAccountVerified: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

UserSchema.virtual('posts', {
    ref: 'Post',
    foreignField: 'user',
    localField: '_id',
});

UserSchema.methods.generateToken = function () {
    return jwt.sign({ id: this._id, isAdmin: this.isAdmin }, process.env.JWT_SECRET_KEY);
};

// User Model
const User = mongoose.model('User', UserSchema);

// Validate Register User
function validateRegisterUser(obj) {
    const shema = Joi.object({
        username: Joi.string().trim().min(2).max(100).required(),
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: passwordComplexity().required(),
    });
    return shema.validate(obj);
};

// Validate Login User
function validateLoginUser(obj) {
    const shema = Joi.object({
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: Joi.string().trim().min(8).required(),
    });
    return shema.validate(obj);
};

function validateEmail(obj) {
    const shema = Joi.object({
        email: Joi.string().trim().min(5).max(100).required().email(),
    });
    return shema.validate(obj);
};

function validateNewPassword(obj) {
    const shema = Joi.object({
        password: passwordComplexity().required(),
    });
    return shema.validate(obj);
};

function validateUpdateUser(obj) {
    const shema = Joi.object({
        username: Joi.string().trim().min(2).max(100),
        password: passwordComplexity(),
        bio: Joi.string(),
    });
    return shema.validate(obj);
};

module.exports = {
    User, validateRegisterUser, validateLoginUser, validateUpdateUser, validateEmail, validateNewPassword
};