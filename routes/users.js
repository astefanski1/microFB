/*jshint node: true */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../Models/User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', function(req, res, next) {
  res.render('login', { });
});

router.post('/register', function(req, res, next) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;

  //Validation
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('firstName', 'First name is required').notEmpty();
  req.checkBody('lastName', 'Last mame is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  var errors = req.validationErrors();

  if(errors){
    res.render('index', {errors: errors});
  } else {
    var newUser = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password
    });

    User.createUser(newUser, function(err, user){
      if(err){throw err; }
      console.log(user);
    });

    req.flash('success_msg', 'You are registered and can now log in');
    res.redirect('/users/login');
  }

  console.log(firstName + " " + lastName + " " + email + " " + password);
});

//Passport Local Strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
      User.getUserByEmail(username, function(err, user){
        if (err) { throw err;}
        if (!user){
          return done(null, false, {message: 'Unkown user'});
        }
        User.comparePassword(password, user.password, function(err, isMatch) {
          if (err) {throw err;}
          if(isMatch){
            return done(null, user);
          }
          else {
            return done(null, false, { message: 'Invalid password'});
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
    res.redirect('/wall');
});

router.get('logout', function(req, res){
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});


module.exports = router;
