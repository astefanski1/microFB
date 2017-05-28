/*jshint node: true, esversion: 6, devel: true */
var express = require('express');
var User = require('../Models/User');
var Post = require('../Models/Post');
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
  Post.find({author: req.user.id}).sort({time: 'desc'}).populate('author').exec(function(err, posts){
    if (err) {throw err;}

    res.render('wall', { title: 'wall', user: req.user, posts: posts });
    console.log(posts);
  });
});

module.exports = router;
