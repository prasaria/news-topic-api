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
    },
    _relatedNews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News'
    }] 
});



var Topic = mongoose.model('Topic', topicsSchema);

module.exports = {Topic}