/*jshint node: true */
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var Post = new Schema({
  text: String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
  time : { type : Date, default: Date.now() }
});

var Post = module.exports =  mongoose.model('Post', Post);
