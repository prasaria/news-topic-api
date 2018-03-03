const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var newsSchema = Schema({
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
    }
})

var News = mongoose.model('News', newsSchema);

module.exports = {News}