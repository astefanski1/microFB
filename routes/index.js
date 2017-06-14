/*jshint node: true, esversion: 6, devel: true */
var express = require('express');
var User = require('../Models/User');
var Post = require('../Models/Post');
var SharedPost = require('../Models/SharedPost');
var Notification = require('../Models/Notification');
var router = express.Router();
/* GET home page. */
router.get('/', ensureIsLogged, function(req, res, next) {
  //Przesyłam success i errory validacji
  res.render('index', { user: req.user });
  //Resetuje errory po renderze widoku
});

router.get('/searchFriends/:text', function(req, res){
  console.log(req.params);
  User.find({ $or: [ { firstName: { $regex: `.*${req.params.text}.*` } }, { lastName: { $regex: `.*${req.params.text}.*` }} ] }, function(err, data){
    if(err){throw err;}
    console.log(data);
    res.send(data);
  });
});


function ensureIsLogged(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/wall');
  }
  else{
    return next();
  }
}

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    req.flash('error_msg', 'U are not logged in');
    res.redirect('/users/login');
  }
}

router.get('/wall', ensureAuthenticated, function(req, res, next) {
  User.findOne({_id: req.user.id}).populate('notifications').populate('friends').populate('friendsFollowing').exec(function(err, user){
      //console.log(user.friends);
      var postsToSend = [];
      var countFriends = 0;
      var isLiked = false;
      Post.find({}).populate('author').populate('sharedPostId').exec(function(err, posts){
        if (err) {throw err;}
        for (var post of posts) {
          isLiked = false;
          for (var friend of user.friendsFollowing) {
            if(friend._id.equals(post.author._id)){
              postsToSend.push(post);
              //console.log();
            }
          }
          if(post.likes.length === 0){
            //console.log(index.author);
            //console.log("Nie ma lajków!");
            post.isLiked = false;
          }else {
            //Petla lajków w poście
            for (var like of post.likes) {
              //jeśli user to polajkował to true jesli nie to false
                if(like.equals(req.user._id)){
                  isLiked = true;
                }
            }
            if(isLiked === true){
              post.isLiked = true;
            }else {
              post.isLiked = false;
            }
            post.save();
          }
          if(user._id.equals(post.author._id)){
            postsToSend.push(post);
            //console.log();
          }
          if(user._id.equals(post.onWall)){
            postsToSend.push(post);
          }
        }

        posts.forEach((post, index) => {
          //console.log(post);
          post.sharedPostId.forEach((sharedPost, index) => {
            //console.log(sharedPost);
            isLiked = false;
            if(sharedPost.likes.length === 0){
              //console.log(index.author);
              //console.log("Nie ma lajków!");
              sharedPost.isLiked = false;
            }else {
              //Petla lajków w poście
              //console.log(sharedPost.likes);
              for (var like of sharedPost.likes) {
                //jeśli user to polajkował to true jesli nie to false
                  if(like.equals(req.user._id)){
                    isLiked = true;
                  }
              }
              if(isLiked === true){
                sharedPost.isLiked = true;
              }else {

                sharedPost.isLiked = false;
              }
            }
            sharedPost.save(function(err){
              user.friendsFollowing.forEach((friend, index) => {
                if(friend._id.equals(sharedPost.sharedByWho)){
                  SharedPost.findOne({_id: sharedPost._id}).populate('author').populate('sharedByWho').exec(function(err, sharedPostToPush){
                    //console.log(sharedPostToPush);
                    postsToSend.push(sharedPostToPush);
                    postsToSend.sort(function(a,b){
                      return new Date(b.time) - new Date(a.time);
                    });
                  });
                }
              });
              if(sharedPost.sharedByWho.equals(user._id)){
                SharedPost.findOne({_id: sharedPost._id}).populate('author').populate('sharedByWho').exec(function(err, sharedPostToPush){
                  //console.log(sharedPostToPush);
                  postsToSend.push(sharedPostToPush);
                  postsToSend.sort(function(a,b){
                    return new Date(b.time) - new Date(a.time);
                  });
                });
              }
            });
          });
        });

        countFriends = user.friends.length;
        console.log(user.friends.length);

        res.render('wall', { title: 'wall', user: req.user, posts: postsToSend, notifications: user.notifications, friends: user.friends, countFriends: countFriends });
        console.log(postsToSend);

      });
  });
});

module.exports = router;
