var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var objectSchema = new Schema({
  id: mongoose.Schema.ObjectId,
  name: String,
  location: String,
  user: String,
  group: {type: String, ref: 'Group'}
});


module.exports = mongoose.model('Obj', objectSchema);
// mongoose.connect('mongodb://localhost/test');