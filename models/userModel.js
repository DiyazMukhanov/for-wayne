const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
        googleId: {
          type: String,
        },
        name: {
          type: String,
        },
        email: {
            type: String,
            required: [true, 'Please provide your email!'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email!']
        },
        password: {
            type: String,
            select: false //will never show up in output
        },
        passwordConfirm: {
            type: String,
            validate: {
                validator: function (el) {
                    return el === this.password;
                },
                message: 'Passwords are not the same!'
            }
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        role: {
            type: String,
            enum: ['user', 'admin', 'manager'],
            default: 'user'
        },
        gender: String,
        subscriptionDate: {
            type: Date,
            default: null
        },
        subscriptionExpirationDate: {
            type: Date,
            default: null
        },
        subscribedMore: {
            type: Boolean,
            default: false
        },
        level: {
            type: String,
            default: 'elementary'
        },
        levelChecked: {
            type: Boolean,
            default: false
        },
        currentLesson: {
            type: Number,
            default: 0
        },
        currentChapter: {
            type: String,
            default: 'no'
        },
        progress: [],
        language: {
            type: String,
            default: 'russian'
        },
        movedToNextLevelDate: {
            type: Date
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
});

// Encrypting the password
userSchema.pre('save', async function(next) {
    //this word points to current document (current user)

    //Only run this function if password was modified
    if(!this.isModified('password')) return next();

    //Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12); //12 is CPU intensity for hashing. By default, is 10. hash is asynchronous

    //Delete the passwordConfirm field from the model
    this.passwordConfirm = undefined; //because we don't want to save this in DB. Only using for confirmation
});

userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; //to ensure that token created after the password changed if DB slow
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    //False means not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 min
    
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;