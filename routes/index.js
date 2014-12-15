var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Obj = mongoose.model('Obj');

/* GET home page. */
// router.get('/', function(req, res, next) {
// 	Obj.find().toArray(function (error, objs) {
// 		res.render('index', { 
// 			title: 'Express',
// 			objs: objs || [] 
// 		});
// 	});
// });

router.get('/', function(req, res) {
	res.render('index', { title: 'Add New User' });
});


/* GET Userlist page. */
router.get('/userlist', function(req, res) {
    var db = req.db;
    var collection = db.get('usercollection');
    collection.find({},{},function(e,docs){
        res.render('userlist', {
            "userlist" : docs
        });
    });
});

// /* GET New User page. */
// router.get('/newuser', function(req, res) {
//     res.render('newuser', { title: 'Add New User' });
// });

/* POST to Add User Service */
router.post('/add', function(req, res) {

    // // Set our internal DB variable
    // var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var nameObj = req.body.nameObj;
    var locationObj = req.body.locationObj;
    var user = req.body.user;

    // if(userEmail.indexOf("@") <= -1) {
    //     res.send("Email address not valid");
    var newObj = new Obj({
    	name: nameObj,
    	location: locationObj,
    	user: user
    });

    newObj.save(function (err) {
    	if (err) {
    		res.send("There was a problem adding the info to MongoDB.");
    	}
    	else {
    		res.redirect('/');
    	}
    });
    
});

module.exports = router;