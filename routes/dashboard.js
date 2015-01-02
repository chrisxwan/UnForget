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

/* GET Customized Dashboard */
router.get('/:id', function(req, res) {
  parseName = function(name) {
    var index = name.indexOf(" ");
    name = name.substring(0, index);
    return name;
  };

  if(req.user) {
    res.render('newdash', {
      title: 'Dashboard',
      userName: parseName(req.user.name),
      groups: req.user.groups,
      id: req.user._id
    });
  }
   else {
    res.redirect('/');
  }
});

/* GET Group Dashboard */
router.get('/:name/:id', function(req, res) {
  parseName = function(name) {
    var index = name.indexOf(" ");
    name = name.substring(0, index);
    return name;
  };

  req.db.groups.findOne({"name": req.params.name}, function (error, group) {
    if(error) return (error);
    console.log(group.objs);
    var objNames = group.objs;
    var objs = [];
    async.eachSeries(objNames, function(objName, callback) {
      req.db.objs.findOne({'name': objName}, function(error, obj) {
        if(error) return (error);
        objs.push(obj);
        callback();
      });
    },
    function(error){
      if(error) return (error);
      console.log(objs);
      if(req.user) {
        res.render('groupdash', {
          title: req.params.name,
          id: req.user._id,
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
});

/* POST to Add Object */
router.post('/:name/:id', function(req, res, next) {

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
    	else {
        req.db.groups.findOne({'name': req.params.name}, function(error, grp) {
          if(error) return next(error);
          // for(email in users) {
          var users = grp.users;
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
              'content': 'If you happen to move ' + req.user.name + "'s " + req.body.nameObj + ", please update it in the group. Thanks (:"
            }];
            var message = {
                "subject": "A new object has been registered!",
                "from_email": "robot@unforget.com",
                "from_name": "UnForget",
                "to": [{
                        "email": users[x],
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
        }
      });
      req.db.groups.update({name: req.params.name}, { $push: {objs: newObj.name}}, function(error) {
        if(error) return (error);
      });
		  res.redirect('/dashboard/' + req.params.name + '/' + req.params.id);    
});

module.exports = router;