const passport = require('passport');
const jwt = require('jsonwebtoken');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

let serverUrl;

if(process.env.NODE_ENV === 'development') {
    serverUrl = 'http://localhost:3000'
} else {
    serverUrl = process.env.SERVER_URL
}

passport.serializeUser((user , done) => {
    done(null , user);
})
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID, // Your Credentials here.
    clientSecret: process.env.CLIENT_SECRET, // Your Credentials here.
    // callbackURL:"https://langy-api.onrender.com/auth/google/callback",
    callbackURL:`${serverUrl}/auth/google/callback`,
    passReqToCallback:true
  },
  async (request, accessToken, refreshToken, profile, done) => {
        try{
        // Check if the user already exists in the database
        let user = await User.findOne({ googleId: profile.id });

        if(!user) {
            user = await User.create({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                createdAt: new Date()
            });
        }
    
    // Create a JWT token with the user information
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    const userWithToken = {
        user,
        token
    };

    // Pass the token to the callback function
    return done(null, userWithToken);
} catch(error) {
    return done(error)
}}));

// export const registerUser = async (bodyData) => {
//     return await axios.post(`${apiUrl}/users/signup`, bodyData, { withCredentials: true, headers: { 'Content-Type': 'application/json'} })
//  } 
  


// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: 'http://localhost:3000/auth/google/callback',
// }, 
// async (accessToken, refreshToken, profile, done) => {
//     try{
//         // Check if the user already exists in the database
//         let user = await User.findOne({ googleId: profile.id });

//         if(!user) {
//             user = await User.create({
//                 googleId: profile.id,
//                 name: profile.displayName,
//                 email: profile.emails[0].value,
//                 createdAt: new Date()
//             });
//         }
    
//     // Create a JWT token with the user information
//     const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_EXPIRES_IN
//     });

//     const userWithToken = {
//         user,
//         token
//     };

//     // Pass the token to the callback function
//     return done(null, userWithToken);
// } catch(error) {
//     return done(error)
// }}
// ))

