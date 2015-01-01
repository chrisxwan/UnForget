var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// require('./user');
var Obj = mongoose.model('Obj');
// var User = mongoose.model('User');

var groupSchema = new Schema({
  id: mongoose.Schema.ObjectId,
  name: String,
  description: String,
  users: [ {type: String, ref: 'User'}],
  objs: [{type: String, ref: 'Obj'}]
});


module.exports = mongoose.model('Group', groupSchema);
// mongoose.connect('mongodb://localhost/test');