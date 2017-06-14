/*jshint node: true, esversion: 6 */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../Models/User');
var Post = require('../Models/Post');
var SharedPost = require('../Models/SharedPost');
var Notification = require('../Models/Notification');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/profile/:username', function(req, res, next){
  var username = req.params.username;
  User.findOne({username: username }).populate('notifications').exec(function(err, profileUser){
    console.log(profileUser);
    if(profileUser === null){
      return res.redirect('/wall');
    }
    console.log("Profile page: " + profileUser.firstName + " " + profileUser.lastName);
    console.log("Searching friend: " + req.user.id);
    var friends = profileUser.friends;
    var userReq = req.user;
    var notifications = profileUser.notifications;
    var friendsInvites = profileUser.friendsInvites;
    var inviteSended = false;
    var isMyFriend = false;
    var countFriends = 0;
    var profileUserFriendsCount = profileUser.friends.length;
    var isLiked = false;
    var isFollowing = false;
    console.log(profileUser.friends.length);
    console.log("Notyfikacja: " + notifications);
    //jeśli wszedłeś na siebie renderuje twojego walla
    if(userReq.id === profileUser.id){
      Post.find({ $or: [ { author: profileUser.id }, { onWall: profileUser.id } ] }).sort({time: 'desc'}).populate('author').populate('sharedPostId').exec(function(err, posts){
        var postsToSend = posts;
        if (err) {throw err;}
        console.log("renderuje to");
        User.findOne({username: profileUser.username}).populate('friends').exec(function(err, userFriends){
          //Searching shared posts
          posts.forEach((post, index) => {
            post.sharedPostId.forEach((sharedPost, index) => {
              //checking likes on shared post
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
                //each shared post
                userReq.friends.forEach((friend, index) => {
                  //checking shared posts by friends
                  if(friend.equals(sharedPost.sharedByWho)){
                    SharedPost.findOne({_id: sharedPost._id}).populate('author').populate('sharedByWho').exec(function(err, sharedPostToPush){
                      //console.log(sharedPostToPush);
                      postsToSend.push(sharedPostToPush);
                      postsToSend.sort(function(a,b){
                        return new Date(b.time) - new Date(a.time);
                      });
                    });
                  }
                });
                //checking shared posts by me
                if(sharedPost.sharedByWho.equals(userReq._id)){
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

          res.render('wall', { title: 'wall', user: req.user, posts: postsToSend, notifications: notifications, countFriends: profileUser.friends.length, friends: userFriends.friends });
        });
      });
    } else{
      //Jeśli nie weszliśmy na siebie to
      Post.find({ $or: [ { author: profileUser.id }, { onWall: profileUser.id } ] }).sort({time: 'desc'}).populate('author').populate('sharedPostId').exec(function(err, posts){
        if (err) {throw err;}
        var postsToSend = posts;
        User.findOne({_id: userReq.id}).populate('notifications').populate('friends').populate('friendsFollowing').exec(function(err, user){
          console.log("Sprawdzamy znajomych");
          //Sprawdzamy czy lista znajomych jest pusta
          if(friends.length !== 0){
            console.log("Mam znajomych");
            //jeśli nie to Sprawdzamy czy jestesmy znajomymi
            for (var friend of friends) {
              //jeśli jesteś jego znajomym
              countFriends += 1;
              if(friend.equals(userReq._id)){
                isMyFriend = true;
              }
            }
            if(isMyFriend === true){
              for (var post of posts) {
                isLiked = false;
                if(post.likes.length === 0){
                  post.isLiked = false;
                }
                else {
                  for (var like of post.likes) {
                    if(like.equals(userReq._id)){
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
              }
              //Searching shared posts
              posts.forEach((post, index) => {
                post.sharedPostId.forEach((sharedPost, index) => {
                  //checking likes on shared post
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
                    //each shared post
                    userReq.friends.forEach((friend, index) => {
                      //checking shared posts by friends
                      if(friend.equals(sharedPost.sharedByWho)){
                        console.log("BLABL");
                        SharedPost.findOne({_id: sharedPost._id}).populate('author').populate('sharedByWho').exec(function(err, sharedPostToPush){
                          console.log(sharedPostToPush);
                          postsToSend.push(sharedPostToPush);
                          postsToSend.sort(function(a,b){
                            return new Date(b.time) - new Date(a.time);
                          });
                        });
                      }
                    });
                    //checking shared posts by me
                    if(sharedPost.sharedByWho.equals(userReq._id)){
                      SharedPost.findOne({_id: sharedPost._id}).populate('author').populate('sharedByWho').exec(function(err, sharedPostToPush){
                        console.log(sharedPostToPush);
                        postsToSend.push(sharedPostToPush);
                        postsToSend.sort(function(a,b){
                          return new Date(b.time) - new Date(a.time);
                        });
                      });
                    }
                  });
                });
              });

              user.friendsFollowing.forEach((follow, index) => {
                if(follow.equals(profileUser._id)){
                  isFollowing = true;
                }
              });

              res.render('profile', {user: userReq,
                                     profileUser: profileUser,
                                     isFriend: true,
                                     notifications: user.notifications,
                                     posts: postsToSend,
                                     friends: user.friends,
                                     countFriends: profileUser.friends.length,
                                     isFollowing: isFollowing
                                     });
            }
            //jeśli jeszcze nie jesteś jego znajomym
            else {
              console.log("Nie jest moim znajomym");
              for (var inviteCheck of friendsInvites) {
                if(inviteCheck.equals(userReq._id)){
                  inviteSended = true;
                }
              }
              if(inviteSended === true){
                res.render('profile', {user: user,
                                       profileUser: profileUser,
                                       isFriend: false,
                                       notifications: user.notifications,
                                       friends: user.friends,
                                       inviteSended: true});
              }else {
                res.render('profile', {user: user,
                                       profileUser: profileUser,
                                       isFriend: false, notifications:
                                       user.notifications,
                                       friends: user.friends});
              }

            }
          }else{
            //Jeśli lista jest pusta
            //Sprawdzamy czy wyslałeś już zaproszenie do znajomych
            for (var invite of friendsInvites) {
              if(invite.equals(userReq._id)){
                inviteSended = true;
              }
            }
            //Jeśli tak
            if(inviteSended === true){
                res.render('profile', { title: 'wall',
                                       user: req.user,
                                       posts: posts,
                                       notifications: user.notifications,
                                       inviteSended: true,
                                       friends: user.friends});
            } else{
              //Jeśli nie
              res.render('profile', {user: user,
                                     profileUser: profileUser,
                                     isFriend: false,
                                     notifications: user.notifications,
                                     friends: user.friends});
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
