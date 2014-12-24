var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Obj = mongoose.model('Obj');
var User = mongoose.model('User');

var groupSchema = new Schema({
  id: mongoose.Schema.ObjectId,
  name: String,
  users: [ {type: mongoose.Schema.ObjectId, ref: 'User'}],
  objs: [ {type: mongoose.Schema.ObjectId, ref: 'Obj'}]
});


module.exports = mongoose.model('Group', groupSchema);
// mongoose.connect('mongodb://localhost/test');