const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const bodyParser = require('body-parser');
// const passport = require('passport');
const chatGpt = require('./../controllers/chatGpt')
const paymentController = require('./../controllers/paymentController')

const router = express.Router();
const jsonParser = bodyParser.json();

router.post('/signup', jsonParser, authController.signup);
router.post('/login', jsonParser, authController.login);
router.post('/forgotPassword', jsonParser, authController.forgotPassword);
router.patch('/resetPassword/:token', jsonParser, authController.resetPassword);
router.get('/logOut', jsonParser, authController.logOut);

router.post('/paymentOut', jsonParser, paymentController.paymentOut);
router.post('/paymentOut/post', jsonParser, paymentController.postLinkResponse);

router.use(authController.protect); //this will protect all routes coming after this point

router.post('/essay', jsonParser, chatGpt.essayComment);
router.post('/addProgress', jsonParser, userController.addProgress);
router.post('/addMultipleProgresses', jsonParser, userController.addMultipileProgress);
router.get('/progress', jsonParser, userController.getUserProgress);
router.delete('/progress', userController.deleteProgresses);
router.delete('/allProgresses', userController.deleteAllProgress);

router.post('/payment', jsonParser, paymentController.testPAyment);

router.get('/me',
    userController.getMe,
    userController.getUser
);

router.patch('/me', jsonParser, userController.updateMe);
router.patch('/subscribe', jsonParser, userController.subscribe);
router.delete('/me', userController.deleteMe);


//Add restriction
router.get('/', authController.restrictTo( 'manager'), userController.getAllUsers);
router.get('/byEmail/:email', authController.restrictTo( 'admin', 'manager'), jsonParser, userController.getUserByEmail);
// router.get('/everSubscribedQuantity', authController.restrictTo( 'manager'), userController.getUsersQuantityBoughtSubscription);
// router.get('/subscribedMoreQuantity', authController.restrictTo( 'manager'), userController.getSubscribedMoreQuantity);
// router.get('/registeredByDates', jsonParser, authController.restrictTo('manager'),userController.getRegisteredByMonthsQuantity);
router.get('/getByid/:id', authController.restrictTo( 'admin', 'manager'), userController.getUser);
// router.get('/nextLevelQuantity', jsonParser, authController.restrictTo( 'manager' ), userController.movedToNextLevelByMonthsQuantity);
router.patch('/subscribeById/:id', jsonParser, authController.restrictTo( 'admin', 'manager'), userController.subscribeById);
router.delete('/user/:id', authController.restrictTo('manager'), userController.deleteUser);
router.get('/statistics', authController.restrictTo('manager'), userController.getStatistics)

module.exports = router;
