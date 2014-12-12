var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objectSchema = new Schema({
  name: String,
  location: String,
  user: String
});


module.exports = mongoose.model('Obj', objectSchema);
mongoose.connect('mongodb://localhost/test');