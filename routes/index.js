var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
});



// /* GET Userlist page. */
// router.get('/userlist', function(req, res) {
//     var db = req.db;
//     var collection = db.get('usercollection');
//     collection.find({},{},function(e,docs){
//         res.render('userlist', {
//             "userlist" : docs
//         });
//     });
// });

// /* GET New User page. */
// router.get('/newuser', function(req, res) {
//     res.render('newuser', { title: 'Add New User' });
// });

/* POST to Add User Service */
router.post('/addObj', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var nameObj = req.body.nameObj;
    var locationObj = req.body.locationObj;
    var user = req.body.user;

    // Set our collection
    var collection = db.get('usercollection');

    if(userEmail.indexOf("@") <= -1) {
        res.send("Email address not valid");

    
    // Submit to the DB
    collection.insert({
        "nameObj" : nameObj,
        "locationObj" : locationObj,
        "user" : user
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // If it worked, set the header so the address bar doesn't still say /adduser
            // And forward to success page
            res.send("Success");
        }
    });
});

module.exports = router;