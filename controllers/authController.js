const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const {promisify} = require("util");
const crypto = require("crypto");
const Email = require("./../utils/email");
const passport = require('passport');

const clientUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : process.env.CLIENT_URL

const signToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
   
    user.password = undefined; //prevent showing password in the output

    // Set the access_token in an HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 1000*60*60*720,
        secure: true, // If using HTTPS
        
    });

    res.status(statusCode).json({
        status: 'success',
        // token,
        data: {
            user: user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const existedUser = await User.findOne({email: req.body.email})
    if(existedUser) {
        res.status(200).json({
            message: 'User exists',
            data: existedUser
        })

        return;
    }

    const newUser = await User.create({
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        gender: req.body.gender,
        passwordChangedAt: req.body.passwordChangedAt
    });
    createSendToken(newUser, 201, res);
    }
);

exports.login = catchAsync(async (req, res, next) => {
   const { email, password } = req.body;  //req.body.email

    // 1) Check if email and password exist
    if(!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password'); //{ email: email } .select('+password') - to show password which is not normally shown
    if(!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Send token to the client if everything is ok
    createSendToken(user, 200, res);
});

exports.logOut = catchAsync(async(req, res, next) => {
    req.logout();
    res.clearCookie('token');
    res.send('Logged out and cookie removed.');
    // res.redirect(`http://localhost:8080`);
})

// Protecting routes for logged in users only
exports.protect = catchAsync(async (req, res, next) => {
    // 1)   Getting token and check if it's there
    let token;

    if(req.cookies.token) {
        token = req.cookies.token 
    }

    if(!token) {
        return next(new AppError('You are not logged in!', 401));
    }

    // 2)   Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //verified token

    // 3)   Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if(!freshUser) {
        return next(new AppError('The user doesnt exist', 401));
    }

    // 4)   Check if user changed password after token was issued
    if(freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently chnaged password! Please login again', 401));
    }

    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;

    next();
});

// Restricting to admin only
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have a permission', 403));
        }
        next();
    }
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new AppError('There is no user with this email address', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save( { validateBeforeSave: false });

    // 3) Send url to users email
    try{
        const resetUrl = `${clientUrl}/authorization/reset/${resetToken}`
        await new Email(user, resetUrl).sendPasswordReset();
    } catch(err) {
        console.log(err)
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save( { validateBeforeSave: false });

        return next(new AppError('Error sending an email. Try later!'), 500)
    }

    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    })
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken =crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    });

    // 2) If the token has not expired, and there is user, set the new password
    if(!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Login the user, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong!', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});

exports.sendTokenByGoogle = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;  //req.body.email
 
     // 1) Check if email and password exist
     if(!email || !password) {
         return next(new AppError('Please provide email and password!', 400));
     }
 
     // 2) Check if user exists and password is correct
     const user = await User.findOne({ email }).select('+password'); //{ email: email } .select('+password') - to show password which is not normally shown
     if(!user || !await user.correctPassword(password, user.password)) {
         return next(new AppError('Incorrect email or password', 401));
     }
 
     // 3) Send token to the client if everything is ok
     createSendToken(user, 200, res);
 });


