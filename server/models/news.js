const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {Topic} = require('./topic');

var newsSchema = new Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        minlength: 5,
        trim: true
    },
    _relatedTopics: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Topic'
    }] 
});

var News = mongoose.model('News', newsSchema);

module.exports = {News}