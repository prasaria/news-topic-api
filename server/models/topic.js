const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {News} = require('./news');

var topicsSchema = new Schema ({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    }
});

topicsSchema.virtual('articles', {
    ref: 'News', // The model to use
    localField: '_id', // Find news where `localField`
    foreignField: 'relatedNews', // is equal to `foreignField`
});

var Topic = mongoose.model('Topic', topicsSchema);

module.exports = {Topic}