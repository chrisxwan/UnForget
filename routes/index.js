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


/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title: 'UnForget'
	});
});

/* POST to Add Object */
router.post('/dashboard/:name/:id', function(req, res, next) {

    // Get our form values. These rely on the "name" attributes
    var nameObj = req.body.nameObj;
    var locationObj = req.body.locationObj;

    var newObj = new Obj({
    	name: nameObj,
    	location: locationObj,
    	user: req.user.name,
      group: req.params.name
    });

    newObj.save(function (err) {
    	if (err) {
    		res.send("There was a problem adding the info to MongoDB.");
    	}
    	// else {
     //    Group.find({name: req.params.name}, function(error, grp) {
     //      if(error) return next(error);
     //      // for(email in users) {
     //      var users = grp.users;
     //      for(var x=0; x<users.length; x++) {
     //        var template_name = "unforget-v1";
     //        var template_content = [{
     //          'name': 'preview',
     //          'content': 'A new object has been registered!'
     //        },
     //        {
     //          'name': 'body',
     //          'content': req.user.name + ' wants to keep track of ' + req.body.nameObj
     //        },
     //        {
     //          'name': 'description',
     //          'content': 'If you happen to move ' + req.user.name + "'s " + req.body.nameObj + ", please update it in the group! Thanks (:"
     //        }];
     //        var message = {
     //            "subject": "A new object has been registered!",
     //            "from_email": "robot@unforget.com",
     //            "from_name": "UnForget",
     //            "to": [{
     //                    "email": users[x],
     //                }],
     //            "important": true,
     //            "track_opens": true,
     //            "track_clicks": true,
     //            "preserve_recipients": true,
     //            "view_content_link": null,
     //            "tracking_domain": null,
     //            "signing_domain": null,
     //            "return_path_domain": null,
     //            "merge": true,
     //            "merge_language": "mailchimp"
     //        };
     //        var async = false;
     //        var ip_pool = "Main Pool";
     //        mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": message, "async": async, "ip_pool": ip_pool}, function(result) {
     //            console.log(result);
     //        }, function(e) {
     //            // Mandrill returns the error as an object with name and message keys
     //            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
     //            // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
     //        });
     //      }

      });
      // req.db.groups.find({name: req.params.name}, function(error, grp) {
      //   if(error) return (error);
      //   grp.objs.push({name: nameObj,
      //                 location: locationObj,
      //                 user: req.user.name,
      //                 group: req.params.name}, function(error) {
      //     if(error) return (error);
      //   });
      // });
      req.db.groups.update({name: req.params.name}, { $push: {objs: newObj.name}}, function(error) {
        if(error) return (error);
      });
		  res.redirect('/dashboard/' + req.params.name + '/' + req.params.id);
      
    // });
    
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