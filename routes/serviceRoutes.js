const express = require('express');
const bodyParser = require('body-parser');
const serviceController = require('../controllers/serviceController')

const router = express.Router();
const jsonParser = bodyParser.json();

const authController = require('./../controllers/authController');

router.use(authController.protect); //this will protect all routes coming after this point

//protect
router.get('/', authController.restrictTo( 'admin', 'manager'), serviceController.getAllRequests);
router.get('/:id', authController.restrictTo( 'admin', 'manager'), serviceController.getServiceRequest);
router.post('/', jsonParser, serviceController.createServiceRequest);
router.post('/:id', authController.restrictTo( 'admin', 'manager'), serviceController.resolveServiceRequest);

module.exports = router;

