/*jshint node: true */
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var Messages = new Schema({
  text: String,
  fromUser: { type: Schema.Types.ObjectId, ref: 'User' },
  toUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  fromUserFirstName: String
});

var Messages = module.exports =  mongoose.model('Messages', Messages);
