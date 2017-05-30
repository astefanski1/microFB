/*jshint node: true, esversion: 6, devel: true */
var express = require('express');
var User = require('../Models/User');
var Post = require('../Models/Post');
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
  User.findOne({_id: req.user.id}).populate('notifications').populate('friends').exec(function(err, user){
      //console.log(user.friends);
      var postsToSend = [];
      var countFriends = 0;
      Post.find({}).sort({time: 'desc'}).populate('author').exec(function(err, posts){
        if (err) {throw err;}
        for (var post of posts) {
          for (var friend of user.friends) {
            if(friend.id == post.author.id){
              postsToSend.push(post);
              console.log("Jestem");
            }
          }
          if(user.id == post.author.id){
            postsToSend.push(post);
          }
        }
        countFriends = user.friends.length;

        //Pętla postów
        var isLiked = false;
        for (var index of posts) {
          isLiked = false;
          console.log(index.likes);
          //Jeśli nie ma lajków to false od razu
          if(index.likes.length === 0){
            console.log(index.author);
            console.log("Nie ma lajków!");
            index.isLiked = false;
          }else {
            //Petla lajków w poście
            for (var like of index.likes) {
              //jeśli user to polajkował to true jesli nie to false
                if(like == req.user.id){
                  isLiked = true;
                }
            }
            if(isLiked === true){
              index.isLiked = true;
            }else {
              index.isLiked = false;
            }
            index.save();
          }

        }
        res.render('wall', { title: 'wall', user: req.user, posts: postsToSend, notifications: user.notifications, friends: user.friends, countFriends: countFriends });
      });
  });
});

module.exports = router;
