var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var objectSchema = new mongoose.Schema({
  name: String,
  location: String,
  user: String
});

/**
 * Hash the password for security.
 * "Pre" is a Mongoose middleware that executes before each user.save() call.
 */

module.exports = mongoose.model('Event', eventSchema);
