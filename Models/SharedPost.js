/*jshint node: true */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SharedPost = new Schema({
  text: String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  time : { type : Date, default: Date.now() },
  numberOfLikes: Number,
  isLiked: {type: Boolean, default: false},
  sharedByWho: { type: Schema.Types.ObjectId, ref: 'User'},
  isShared: {type: Boolean, default: true},
  originalPostId: {type: Schema.Types.ObjectId, ref: 'Post'}
});

var SharedPost = module.exports =  mongoose.model('SharedPost', SharedPost);
