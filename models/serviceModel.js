const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    userId: String,
    userEmail: String,
    topic: String,
    message: String,
    isResolved: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
}
)

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;