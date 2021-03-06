var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Obj = mongoose.model('Obj');
var User = mongoose.model('User');
var Group = mongoose.model('Group');
var secrets = require('../config/secrets');
var crypto = require('crypto');
var passport = require('passport');
var _ = require('lodash');
var async = require('async');
var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);
var nodemailer = require('nodemailer');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(secrets.mandrill.password);
var async = require('async');

/* GET Signup page. */
router.get('/signup', function(req, res) {
  if(req.user) return res.redirect('/dashboard');
	res.render('signup', {
		title: 'Signup'
	});
});

/* POST Signup page */
router.post('/signup', function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  var newUser = new User({
  	name: req.body.name,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    newUser.save(function(err) {
      if (err) return next(err);
      req.logIn(newUser, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
  });
});

/* GET Login page. */
router.get('/login', function(req, res) {
  if (req.user) return res.redirect('/dashboard/' + req.user._id);
	res.render('login', {
		title: 'Login'
	});
});

/* POST Login page. */
router.post('/login', function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
    // return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect('/dashboard/' + req.user._id);
    });
  })(req, res, next);
});

/* GET New Group page. */
router.get('/new-group', function(req, res) {
  res.render('newgroup', {
    title: 'Create New Group'
  });
});

/* POST New Group page. */
router.post('/new-group', function(req, res, next) {
  var parseUsers = function(req, res) {
    var user_emails = req.body.members;
    user_emails = user_emails.replace(" ", ''); // remove whitespace
    var user_array = user_emails.split(',');
    return user_array
  };

  var userEmails = parseUsers(req, res);
  var users = [];
  users[0] = req.user.email;
  for(var x=0; x<userEmails.length; x++) {
    req.db.users.findOne({'email': userEmails[x]}, function(error, user) {
      if(!user) {
        res.send('There is no user with the email' + userEmails[x]);
      } else {
        users.push(user.email);
      }
    });
  }

  var newGroup = new Group({
    name: req.body.name,
    description: req.body.description,
    users: users
  });

  newGroup.save(function(err) {
    if(err) return next(err);
  });
  for(var x=0; x<users.length; x++) {
    req.db.users.update({email: users[x]}, { $push: { groups: newGroup.name }}, function(error) {
      if(error) return (error);
    });
  }


    // AndModify({
    //   query: {email: users[x]}, 
    //   update: { $push: { groups: newGroup.name } }},
    //   function (error, user) {
    //     if (error) return (error);
    //     user.save(function(err){
    //       if(err) return (err);
    //     });
    //   });


    // }
  res.redirect('/dashboard/' + req.user._id);
});






/* GET Logout */
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;