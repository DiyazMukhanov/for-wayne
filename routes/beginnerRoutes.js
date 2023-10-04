const express = require('express');
const bodyParser = require('body-parser');
const authController = require('../controllers/authController');
const beginnerController = require('../controllers/beginnerController');

const router = express.Router();
const jsonParser = bodyParser.json();

router.use(authController.protect); //this will protect all routes coming after this point

//protect
router.post('/', jsonParser, beginnerController.createBeginnerProgress);
router.patch('/', jsonParser, beginnerController.updateBeginnerProgress);
router.get('/', jsonParser, beginnerController.getBeginnerProgress);
router.patch('/exit', beginnerController.exitBeginnerProgress);

module.exports = router;