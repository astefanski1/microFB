/*jshint node: true */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', User);
