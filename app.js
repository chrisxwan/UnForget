require('./models/obj');
require('./models/user');
require('./models/group');


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var userRoutes = require('./routes/user');
var mongoose = require('mongoose');
var db = mongoose.connection;
mongoose.connect('mongodb://localhost/test');
var session = require('express-session');
var flash = require('express-flash');
var errorHandler = require('errorhandler');
// var csrf = require('lusca').csrf();
var methodOverride = require('method-override');
var path = require('path');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');
var MongoStore = require('connect-mongo')(session);
var _ = require('lodash');

var app = express();

// mongoose.connect(secrets.db);

app.use(function(req, res, next) {
  req.db = {};
  req.db.objs = db.collection('objs');
  req.db.users = db.collection('users');
  req.db.groups = db.collection('groups');
  next();
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

/**
 * CSRF whitelist.
 */

// var csrfExclude = ['/url1', '/url2'];

/**
 * CONFIGURE EXPRESS
 */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.use(function(req, res, next) {
//   // CSRF protection.
//   if (_.contains(csrfExclude, req.path)) return next();
//   csrf(req, res, next);
// });
app.use(function(req, res, next) {
  // Make user object available in templates.
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  // Remember original destination before login.
  var path = req.path.split('/')[1];
  if (/auth|login|new_event|logout|signup|fonts|favicon/i.test(path)) {
    return next();
  }
  req.session.returnTo = req.path;
  next();
});

app.use(favicon(__dirname + '/public/img/favicon.ico'));


app.use('/', routes);
app.use('/', userRoutes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
