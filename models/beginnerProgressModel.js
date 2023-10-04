const mongoose = require('mongoose');

const beginnerProgressSchema = new mongoose.Schema({
    userId: String,
    currentLesson: Number,
    completed: []
})

const BeginnerProgress = mongoose.model('BeginnerProgress', beginnerProgressSchema);

module.exports = BeginnerProgress;