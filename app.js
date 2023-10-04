const express = require('express');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('./utils/passportConfiguration');
const cookieSession = require('cookie-session');

let clientUrl;

if(process.env.NODE_ENV === 'development') {
    clientUrl = 'http://localhost:8080'
} else {
    clientUrl = process.env.CLIENT_URL
}

const app = express();

app.use(cookieSession({
    name: 'google-auth-session',
    keys: ['key1', 'key2']
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
    allowedHeaders: ['Authorization', 'Content-Type'],
}))

app.use(cookieParser());

// Auth 
app.get('/api/auth' , passport.authenticate('google', { scope:
    [ 'email', 'profile' ]
}));

// Auth Callback
app.get( '/api/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/api/auth/callback/success',
        failureRedirect: '/api/auth/callback/failure'
}));

// Success 
app.get('/api/auth/callback/success' , (req , res) => {
    if(!req.user)
        res.redirect('/auth/callback/failure');

    const token = req.user.token

    // Set the access_token in an HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, // If using HTTPS
    });

    res.redirect(clientUrl);
});

// failure
app.get('/api/auth/callback/failure' , (req , res) => {
    res.send("Error");
})

const userRouter = require('./routes/userRoutes');
const serviceRouter = require('./routes/serviceRoutes');
const beginnerRouter = require('./routes/beginnerRoutes');

app.use(helmet());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against cross side scripting attacks
app.use(xss());

// 2) Routes
// app.use('/auth', googleRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/beginner', beginnerRouter);

//Error handling middleware
app.use(globalErrorHandler);

// 3) Start server
module.exports = app;