const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAll = Model => catchAsync(async (req, res, next) => {
//{{URL}}api/v1/users?page=2&limit=10
    const features = new APIFeatures(Model.find(), req.query).filter().sort().limitFields().paginate();

    const doc = await features.query;

   res.status(200).json({
       status: 'success',
       results: doc.length,
       data: doc
   })
});
