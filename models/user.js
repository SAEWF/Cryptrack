const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    firstname: {
        type: String,
        default: '',
        required: true
    },
    lastname: {
        type: String,
        default: '',
        required: true,
    },
    isKeyGenerated: {
        type: Boolean,
        default: false,
        required: true,
    },
    APIKey: {
        type: String,
        default: ''
    },
    APISecret: {
        type: String,
        default: ''
    },
    admin: {
        type: Boolean,
        default: false
    }
});

User.plugin(passportLocalMongoose);//added passport auth

module.exports = mongoose.model('Admins', User);