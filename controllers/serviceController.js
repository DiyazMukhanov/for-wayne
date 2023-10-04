const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const Service = require('../models/serviceModel');

exports.getAllRequests = factory.getAll(Service);

exports.createServiceRequest = catchAsync(async (req, res, next) => {
     const newRequest = await Service.create({
        userId: req.user.id,
        userEmail: req.user.email,
        topic: req.body.topic,
        message: req.body.message,
     })

     res.status(200).json({
        status: 'success',
        data: newRequest,
    });
});

exports.resolveServiceRequest = catchAsync(async (req, res, next) => {
    const resolvedRequest = await Service.findByIdAndUpdate(req.params.id, {isResolved: true}, {new: true})

    res.status(200).json({
       status: 'success',
       data: resolvedRequest,
   });
});

exports.getServiceRequest = catchAsync(async (req, res, next) => {
   const serviceRequest = await Service.findById(req.params.id)

   res.status(200).json({
      status: 'success',
      data: serviceRequest,
  });
});

