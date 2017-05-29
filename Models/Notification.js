/*jshint node: true */
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var Notification = new Schema({
  text: String,
  fromUser: { type: Schema.Types.ObjectId, ref: 'User' },
  toUser: { type: Schema.Types.ObjectId, ref: 'User' },
  fromUserFullname: String,
  toFriends: Number
});

var Notification = module.exports =  mongoose.model('Notification', Notification);
