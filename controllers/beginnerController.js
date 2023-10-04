const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const BeginnerProgress = require('./../models/beginnerProgressModel');
const User = require('../models/userModel');

exports.createBeginnerProgress = catchAsync(async (req, res, next) => {
    const existingBeginnerProgress = await BeginnerProgress.find({userId: req.user.id})
    
    if(existingBeginnerProgress.length > 0) {
        res.status(200).json({
            status: 'beginner progress exists',
            data: existingBeginnerProgress
        });

        return
    }

    const beginnerProgress = await BeginnerProgress.create({
       userId: req.user.id,
       currentLesson: 1,
       completedLesson: 0
    })

    const updatedUser = await User.findByIdAndUpdate(req.user.id, {level: 'beginner', levelChecked: true}, {new: true})

    res.status(200).json({
       status: 'success',
       data: beginnerProgress,
       updatedUser
   });
});

exports.updateBeginnerProgress = catchAsync(async (req, res, next) => {
    
    const beginnerProgress = await BeginnerProgress.findOne({userId: req.user.id})

    const updatedBeginnerProgress = await BeginnerProgress.findByIdAndUpdate(beginnerProgress.id, {currentLesson: req.body.currentLesson}, {new: true})

    if(updatedBeginnerProgress.completed.includes(req.body.completedLesson)) {

        res.status(200).json({
            status: 'success',
            data: updatedBeginnerProgress,
        });

        return
    }

    updatedBeginnerProgress.completed.push(req.body.completedLesson)
    await updatedBeginnerProgress.save()
    
    res.status(200).json({
       status: 'success',
       data: updatedBeginnerProgress,
   });
});

exports.getBeginnerProgress = catchAsync(async (req, res, next) => {
     const beginnerProgress = await BeginnerProgress.findOne({userId: req.user.id})

     res.status(200).json({
        status: 'success',
        data: beginnerProgress,
    });
});

exports.exitBeginnerProgress = catchAsync(async (req, res, next) => {
    await BeginnerProgress.deleteMany({userId: req.user.id})

    const updatedUser = await User.findByIdAndUpdate(req.user.id, {level: 'elementary'}, {new: true});

    res.status(200).json({
       status: 'success',
       data: updatedUser,
   });
});

