const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed login!',
  successRedirect: '/',
  successFlash: 'You are now logged in',
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  //check if user is authenticated (easy thanks to passport)
  if (req.isAuthenticated()) {
    next(); // carry on! they are logged in
    return;
  }
  req.flash('error', 'Oops you must be logged in to do that!');
  res.redirect('/login');
};

//forgot authentication
exports.forgot = async (req, res) => {
  // 1. see if user with that email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('success', 'A password reset has been mailed to you.');
    return res.redirect('/login');
  }

  // 2. set reset tokens and expricy on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hr from now
  await user.save();

  // 3. send email with token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `A password reset has been mailed to you. ${resetURL}`);

  //4. redirect to login page after token ha been sent
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  //no user
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  //if there is a user, show the reset form
  res.render('reset', { title: 'Reset your Password' });
};

//check if passwords match
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next(); // keepit going!
    return;
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Nice! Your password has been reset! You are now logged in!');
  res.redirect('/');
};
