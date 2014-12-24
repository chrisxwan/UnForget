var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Obj = mongoose.model('Obj');
var User = mongoose.model('User');
var secrets = require('../config/secrets');
var crypto = require('crypto');
var passport = require('passport');
var _ = require('lodash');
var async = require('async');
var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);
var nodemailer = require('nodemailer');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(secrets.mandrill.password);


/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title: 'UnForget'
	});
});

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
  if (req.user) return res.redirect('/dashboard');
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
      res.redirect('/dashboard');
    });
  })(req, res, next);
});

/* GET Dashboard page. */
router.get('/dashboard', function(req, res) {
  parseName = function(name) {
    var index = name.indexOf(" ");
    name = name.substring(0, index);
    return name;
  };

	req.db.objs.find().toArray(function (error, objs) {
		if(error) return next(error);
    if(req.user) {
  		res.render('dashboard', {
  			title: 'Dashboard',
        //need to fix this if there is nobody logged in
        userName: parseName(req.user.name),
  			objs: objs || []
		  });
    }
    else {
      res.redirect('/');
    }
	});
});


/* POST to Add Object */
router.post('/add', function(req, res) {

    // Get our form values. These rely on the "name" attributes
    var nameObj = req.body.nameObj;
    var locationObj = req.body.locationObj;

    var newObj = new Obj({
    	name: nameObj,
    	location: locationObj,
    	user: req.user.name
    });

    newObj.save(function (err) {
    	if (err) {
    		res.send("There was a problem adding the info to MongoDB.");
    	}
    	else {
        req.db.users.find().toArray(function (error, users, next) {
          if(error) return next(error);
          for(var x=0; x<users.length; x++) {
            var template_name = "unforget-v1";
            var template_content = [{
              'name': 'preview',
              'content': 'A new object has been registered!'
            },
            {
              'name': 'body',
              'content': req.user.name + ' wants to keep track of ' + req.body.nameObj
            },
            {
              'name': 'description',
              'content': 'If you happen to move ' + req.user.name + "'s " + req.body.nameObj + ", please update it in the group! Thanks (:"
            }];
            var message = {
                "subject": "A new object has been registered!",
                "from_email": "robot@unforget.com",
                "from_name": "UnForget",
                "to": [{
                        "email": users[x].email,
                    }],
                "important": true,
                "track_opens": true,
                "track_clicks": true,
                "preserve_recipients": true,
                "view_content_link": null,
                "tracking_domain": null,
                "signing_domain": null,
                "return_path_domain": null,
                "merge": true,
                "merge_language": "mailchimp"
            };
            var async = false;
            var ip_pool = "Main Pool";
            mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": message, "async": async, "ip_pool": ip_pool}, function(result) {
                console.log(result);
            }, function(e) {
                // Mandrill returns the error as an object with name and message keys
                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
            });
          }
        });
		  res.redirect('/dashboard');
      }
    });
    
});

/* GET Logout */
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

/* GET Delete Objects */
router.get('/delete/:id', function(req, res) {
  Obj.findById(req.params.id, function (error, obj) {
    obj.remove(function(error, obj) {
      res.redirect('/dashboard');
    });
  });
});

/* GET Update Objects */
router.get('/update/:id', function(req, res) {
  Obj.findById(req.params.id, function (error, obj) {
    res.render('update', {
      title: 'Update Object',
      //need to fix this if there is nobody logged in
      obj: obj
    });
  });
});

/* POST Update Objects */
router.post('/update/:id', function(req, res, next) {
  Obj.findById(req.params.id, function (error, obj) {
    obj.location = req.body.locationObj
    obj.save(function (err, obj, count) {
      if (err) return next(err);
      req.db.users.find().toArray(function (error, users, next) {
          if(error) return next(error);
          for(var x=0; x<users.length; x++) {
            var template_name = "unforget-v1";
            var template_content = [{
              'name': 'preview',
              'content': 'An object has been moved!'
            },
            {
              'name': 'body',
              'content': req.user.name + ' has moved ' + obj.name + ' to ' + req.body.locationObj + '!'
            },
            {
              'name': 'description',
              'content': 'If you happen to move it again, please update it in the group! Thanks (:'
            }];
            var message = {
                "subject": "An object has been moved!",
                "from_email": "robot@unforget.com",
                "from_name": "UnForget",
                "to": [{
                        "email": users[x].email,
                    }],
                "important": true,
                "track_opens": true,
                "track_clicks": true,
                "preserve_recipients": true,
                "view_content_link": null,
                "tracking_domain": null,
                "signing_domain": null,
                "return_path_domain": null,
                "merge": true,
                "merge_language": "mailchimp"
            };
            var async = false;
            var ip_pool = "Main Pool";
            mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": message, "async": async, "ip_pool": ip_pool}, function(result) {
                console.log(result);
            }, function(e) {
                // Mandrill returns the error as an object with name and message keys
                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
            });
          }
        });
      res.redirect('/dashboard');
    });
  });
});

module.exports = router;