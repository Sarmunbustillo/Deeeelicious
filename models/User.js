const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    require: 'Please Supply an Email Address',
  },
  name: {
    type: {
      String,
      required: 'Please Supply a Name',
      trim: true,
    },
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts:[
    {
      type: mongoose.Schema.ObjectId, ref: 'Store'
    }
  ]
});

userSchema.virtual('gravatar').get(function () {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?=200`;
});

//passport.js will help with the auth and passportLocalMongoose is a plugin that helps adding the fields for it
userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
});
//helps giving nicer error messages
userSchema.plugin(mongodErrorHandler);


module.exports = mongoose.model('User', userSchema);
