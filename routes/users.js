/*jshint node: true, esversion: 6 */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../Models/User');
var Post = require('../Models/Post');
var Notification = require('../Models/Notification');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/profile/:username', function(req, res, next){

  var username = req.params.username;
  console.log(username);
  User.findOne({username: username }).populate('notifications').exec(function(err, profileUser){
    console.log("Profile page: " + profileUser.firstName + " " + profileUser.lastName);
    console.log("Searching friend: " + req.user.id);
    var friends = profileUser.friends;
    var userReq = req.user;
    var notifications = profileUser.notifications;
    var friendsInvites = profileUser.friendsInvites;
    var inviteSended = false;
    var isMyFriend = false;
    console.log("Notyfikacja: " + notifications);
    //jeśli wszedłeś na siebie renderuje twojego walla
    if(userReq.id === profileUser.id){
      Post.find({author: userReq.id}).sort({time: 'desc'}).populate('author').exec(function(err, posts){
        if (err) {throw err;}
        console.log("renderuje to");
        res.render('wall', { title: 'wall', user: req.user, posts: posts, notifications: notifications});
      });
    } else{
      //Jeśli nie weszliśmy na siebie to
      Post.find({author: profileUser.id}).sort({time: 'desc'}).populate('author').exec(function(err, posts){
        if (err) {throw err;}
        User.findOne({_id: userReq.id}).populate('notifications').populate('friends').exec(function(err, user){
          console.log("Sprawdzamy znajomych");
          //Sprawdzamy czy lista znajomych jest pusta
          if(friends.length !== 0){
            console.log("Mam znajomych");
            //jeśli nie to Sprawdzamy czy jestesmy znajomymi
            for (var friend of friends) {
              //jeśli jesteś jego znajomym
              if(friend == userReq.id){
                isMyFriend = true;
              }
            }
            if(isMyFriend === true){
              res.render('profile', {user: userReq, profileUser: profileUser, isFriend: true, notifications: user.notifications, posts: posts, friends: user.friends });
            }
            //jeśli jeszcze nie jesteś jego znajomym
            else {
              console.log("Nie jest moim znajomym");
              res.render('profile', {user: user, profileUser: profileUser, isFriend: false, notifications: user.notifications, friends: user.friends});
            }
          }else{
            //Jeśli lista jest pusta
            //Sprawdzamy czy wyslałeś już zaproszenie do znajomych
            for (var invite of friendsInvites) {
              if(invite == userReq.id){
                inviteSended = true;
              }
            }
            //Jeśli tak
            if(inviteSended === true){
                res.render('profile', { title: 'wall', user: req.user, posts: posts, notifications: user.notifications, inviteSended: true, friends: user.friends});
            } else{
              //Jeśli nie
              res.render('profile', {user: user, profileUser: profileUser, isFriend: false, notifications: user.notifications, friends: user.friends});
            }
          }
        });
      });
    }
  });
});

router.get('/login', ensureIsLogged, function(req, res, next) {
  res.render('login', { user: req.user , message: req.flash('signupMessage') });
});

router.post('/register', ensureIsLogged,function(req, res, next) {
  var username = req.body.username;
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;

  //Validation
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('firstName', 'First name is required').notEmpty();
  req.checkBody('lastName', 'Last mame is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  var errors = req.validationErrors();



  if(errors){
    res.render('index', {errors: errors, user: req.user});
  }
  else {
    User.findOne({ $or: [ { email: email }, { username: username } ] }, function(err,user){
      if(err) {throw err;}
      if(user){
        res.render('index', {singUpError: "That email or username already exists!", user: req.user});
      }
      else{
        var newUser = new User({
          username: username,
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password
        });

        User.createUser(newUser, function(err, user){
          if(err){throw err; }
          console.log(user);
        });
        res.render('login', { user: req.user, message: "Registration complete! U can now login! ;)"});
      }
    });
  }

  console.log(firstName + " " + lastName + " " + email + " " + password);
});

//Passport Local Strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
      User.getUserByEmail(username, function(err, user){
        if (err) { throw err;}
        if (!user){
          return done(null, false, { message: 'Unkown user!'});
        }
        User.comparePassword(password, user.password, function(err, isMatch) {
          if (err) {throw err;}
          if(isMatch){
            return done(null, user);
          }
          else {
            return done(null, false, { message: 'Password is not valid!'} );
          }
        });
      });
  }
));

//Passport serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {successRedirect: '/wall', failureRedirect: '/users/login', failureFlash: true}),
  function(req, res) {
    res.render('/wall', {user: req.user, message: req.flash('message')});
});

router.get('/logout', function(req, res){
  req.logout();
  res.render('login', { user: req.user, message: 'U succesfully logged out!' });
});

function ensureIsLogged(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/wall');
  }
  else{
    return next();
  }
}


module.exports = router;
