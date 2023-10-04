const factory = require('./handlerFactory');
const User = require('./../models/userModel');
const AppError = require("../utils/appError");
const catchAsync = require('./../utils/catchAsync');
const Progress = require('../models/progressModel');
const BeginnerProgress = require('../models/beginnerProgressModel');

exports.getAllUsers = factory.getAll(User);

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.getUser = catchAsync(async (req, res, next) => {

    const currentUser = await User.findById(req.params.id);
    
    if(!currentUser) {
        return next(new AppError('No document found with that ID', 404));
    }

    //Check if user is subscribed
    const currentDate = new Date();
    const subscriptionDate = new Date(currentUser.subscriptionExpirationDate);
    const isSubscribed = subscriptionDate > currentDate;

    const userResponse = {
        ...currentUser.toObject(), isSubscribed: isSubscribed
    }

    res.status(200).json({
        status: 'success',
        data: userResponse,
    });
});

exports.getUserByEmail = catchAsync(async (req, res, next) => {
    // console.log(req.params.email)
    const currentUser = await User.findOne({email: req.params.email});
    
    if(!currentUser) {
        return next(new AppError('No document found with that ID', 404));
    }

    //Check if user is subscribed
    const currentDate = new Date();
    const isSubscribed = new Date(currentUser.subscriptionExpirationDate) > currentDate;

    const userResponse = {
        ...currentUser.toObject(), isSubscribed: isSubscribed
    }

    res.status(200).json({
        status: 'success',
        data: userResponse,
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
        new: true,
        runValidators: true
    });

    //Check if user is subscribed
    const currentDate = new Date();
    const isSubscribed = new Date(updatedUser.subscriptionExpirationDate) > currentDate;

    const userResponse = {
        ...updatedUser.toObject(), isSubscribed: isSubscribed
    }

    res.status(200).json({
        status: 'success',
        data: userResponse,
    });
});

exports.subscribe = catchAsync(async(req, res, next) => {
    // Calculate when subscr will finish
    const d = new Date();
    const days = req.body.days;
    const subscrDateMiliSec = d.getTime();
    const daysToMiliSec = days * 24 * 60 * 60 * 1000;
    const subscrFinishes = new Date(subscrDateMiliSec + daysToMiliSec).toISOString();

    const updateObj = {
        subscriptionExpirationDate: subscrFinishes,
        subscriptionType: req.body.subscriptionType,
        subscriptionDate: new Date(),
        // subscribedMore: subscribedMore
    }
  
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateObj, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: updatedUser
    })
});

exports.subscribeById = catchAsync(async(req, res, next) => {
    let subscribedMore;
    const user = await User.findById(req.params.id)

    if(user.subscriptionExpirationDate !== null) {
        subscribedMore = true;
    }
    const d = new Date();
    const days = req.body.days;
    const subscrDateMiliSec = d.getTime();
    const daysToMiliSec = days * 24 * 60 * 60 * 1000;
    const subscrFinishes = subscrDateMiliSec + daysToMiliSec;

    const updateObj = {
        subscriptionExpirationDate: subscrFinishes,
        subscriptionType: req.body.subscriptionType,
        subscriptionDate: new Date(),
        subscribedMore: subscribedMore
    }

    //Condition code
    if(user.subscriptionExpirationDate > new Date()) {

        res.status(200).json({
            message: 'Already subscribed',
            data: {
                user: req.user
            }
        })

        return;
    }
    //End condition code

    const updatedUser = await User.findByIdAndUpdate(user.id, updateObj, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: updatedUser
    })
});

// exports.getUsersQuantityBoughtSubscription = catchAsync(async (req, res, next) => {
//      const usersQuantity = await User.find({'subscriptionExpirationDate' : {$ne: null}}).countDocuments();
//      res.status(200).json({
//         status: 'success',
//         count: usersQuantity
//     })
// });

// exports.getSubscribedMoreQuantity = catchAsync(async (req, res, next) => {
//     const usersQuantity = await User.find({subscribedMore: true}).countDocuments();
//     res.status(200).json({
//         status: 'success',
//         count: usersQuantity
//     });
// });

// exports.getRegisteredByMonthsQuantity = catchAsync(async (req, res, next) => {
//     const startDate = new Date(req.body.startDate); //'2023-01-31'
//     const endDate = new Date(req.body.endDate); //'2023-01-31'
    
//     const usersQuantity = await User.find({ createdAt: {
//         $gte: startDate,
//         $lt: endDate
//     }}).countDocuments();

//     res.status(200).json({
//         status: 'success',
//         count: usersQuantity
//     });
// });

// exports.movedToNextLevelByMonthsQuantity = catchAsync(async (req, res, next) => {
//     const startDate = new Date(req.body.startDate); //'2023-01-31'
//     const endDate = new Date(req.body.endDate); //'2023-01-31'

//     const usersQuantity = await User.find({ movedToNextLevelDate: {
//         $gte: startDate,
//         $lt: endDate
//     }}).countDocuments();

//     res.status(200).json({
//         status: 'success',
//         count: usersQuantity
//     });
// });

exports.getStatistics = catchAsync(async (req, res, next) => {
    const currentDate = new Date();
    const allStudentsQuantity = await User.find().countDocuments()
    const subscribedEverStudents = await User.find({'subscriptionExpirationDate' : {$ne: null}}).countDocuments();
    const subscibedNow = await User.find({'subscriptionExpirationDate' : {$gte: currentDate}}).countDocuments();
    const subscibedNowElementary = await User.find({'subscriptionExpirationDate' : {$gte: currentDate}, 'level': 'elementary'}).countDocuments();
    const subscibedNowPreIntermediate= await User.find({'subscriptionExpirationDate' : {$gte: currentDate}, 'level': 'preIntermediate'}).countDocuments();
    const subscibedNowIntermediate= await User.find({'subscriptionExpirationDate' : {$gte: currentDate}, 'level': 'intermediate'}).countDocuments();

    res.status(200).json({
        status: 'success',
        stats: {
            allStudentsQuantity,
            subscribedEverStudents,
            subscibedNow,
            subscibedNowElementary,
            subscibedNowPreIntermediate,
            subscibedNowIntermediate
        }
    }); 

})

// exports.getUserById = catchAsync(async (req, res, next) => {
//     const user = await User.findById(req.params.id);
    
//     res.status(200).json({
//         status: 'success',
//         data: user.createdAt
//     });
// });

exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = req.user;

    await User.findByIdAndDelete(user.id)
  
      res.status(204).json({
          status: 'success',
          data: null
      });
  });

  exports.deleteUser = catchAsync(async (req, res, next) => {
    await User.findByIdAndDelete(req.params.id);

    res.status(204).json({
        message: 'deleted',
        status: 'deleted',
        data: null
    })
});

 exports.addProgress = catchAsync(async (req, res, next) => {
    const existingProgress = await Progress.findOne({
       userId: req.user.id,
       lesson: req.body.lessonNumber,
       chapter: req.body.chapterCode
    });

    if(existingProgress) {
        
        res.status(200).json({
            status: 'success',
            message: 'Already exists'
        });
    } else {
        const newProgress = await Progress.create({
            userId: req.user.id,
            lesson: req.body.lessonNumber,
            chapter: req.body.chapterCode
        });
    
        res.status(200).json({
            status: 'success',
            data: newProgress
        });
    }
 });

 exports.getUserProgress = catchAsync(async (req, res, next) => {
    const userProgress = await Progress.find({
        userId: req.user.id
    });

    res.status(200).json({
        status: 'success',
        data: userProgress
    });
 });

 exports.addMultipileProgress = catchAsync(async (req, res, next) => {
    const level = req.body.level;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, {levelChecked: true, level: level}, {
        new: true,
        runValidators: true
    });

    function generateLessonArray(lessonNumber) {
        const chapters = ['gr', 'au', 'wr', 'ts'];
        const userId = req.user.id;
      
        const lessonArray = [];
      
        for (let lesson = 1; lesson <= lessonNumber; lesson++) {
          for (const chapter of chapters) {
            lessonArray.push({
              userId,
              lesson,
              chapter
            });
          }
        }
      
        return lessonArray;
      }

      const preIntermediateProgress = generateLessonArray(8);
      const intermediateProgress = generateLessonArray(16);

      if(level === 'elementary') {

         res.status(200).json({
             status: 'success',
             data: updatedUser
         });
        
       }

      if(level === 'preIntermediate') {

       const existingProgress = await Progress.find({
            userId: req.user.id,
            lesson: { $lte: 8 },
       })

       if(existingProgress.length === 0) {
        const multiplePorgresses = await Progress.create(preIntermediateProgress);

        res.status(200).json({
            status: 'success',
            data: multiplePorgresses
        });
       } else {
        res.status(200).json({
            status: 'success',
            message: 'Progresses already exist'
        });
       }
      }

      if(level === 'intermediate') {
        const existingProgress = await Progress.find({
            userId: req.user.id,
            lesson: { $gte: 9, $lte: 16 },
       })

       if(existingProgress.length === 0) {
        const multiplePorgresses = await Progress.create(intermediateProgress);

        res.status(200).json({
            status: 'success',
            data: multiplePorgresses
        });
       } else {
        res.status(200).json({
            status: 'success',
            message: 'Progresses already exist'
        });
       }
      }
    } 
    );

    exports.deleteProgresses = catchAsync(async (req, res, next) => {
        const updatedUser = await User.findByIdAndUpdate(req.user.id, {levelChecked: false, level: 'beginner', currentLesson: 0, currentChapter: 'no'}, {
            new: true,
            runValidators: true
        });

        await Progress.deleteMany({userId: req.user.id});

        await BeginnerProgress.deleteMany({userId: req.user.id})

        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    exports.deleteAllProgress = catchAsync(async (req, res, next) => {
    
        await Progress.deleteMany({});
    
        res.status(204).json({
            status: 'success',
            data: null
        });
    });









