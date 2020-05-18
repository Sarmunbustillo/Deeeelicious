const mongoose = require('mongoose');
const Review = mongoose.model('Review');

//this is the data we are submitting with the review form
exports.addReview = async (req, res) => {
  //save the author and the store that is coming along
  req.body.author = req.user._id;
  req.body.store = req.params.id;
  //pass it to the Schema
  const newReview = new Review(req.body);
  await newReview.save();
  req.flash('success', 'Review Scaved!');
  res.redirect('back');
};
