const mongoose = require('mongoose');

const porgressSchema = new mongoose.Schema({
    userId: String,
    lesson: Number,
    chapter: String
})

const Progress = mongoose.model('Progress', porgressSchema);

module.exports = Progress;