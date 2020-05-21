const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author',
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: 'You must supply an author!',
  },
  text: {
    type: String,
    required: 'Your Review must have text!',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

function autopopulate(next) {
  this.populate('author');
  next();
}

//these are hooks, when  'find or findOne' then run the func
reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);
module.exports = mongoose.model('Review', reviewSchema);
