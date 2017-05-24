/*jshint node: true, esversion: 6, devel: true */
var express = require('express');
var User = require('../Models/User');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  //Przesyłam success i errory validacji
  res.render('index', { success: req.session.success, errors: req.session.errors });
  //Resetuje errory po renderze widoku
  req.session.errors = null;
});

router.get('/authentication', function(req, res, next) {
  res.render('authentication', { title: 'Express' });
});

router.post('/login', function(req, res, next) {
  User.find({email: req.body.email}, function(err, user){
    if(err) {throw err;}
    if(req.body.email === user.email && req.body.password === user.password){
      req.session.success = true;
      res.render('wall', { success: true, userFirstName: user.firstName, userEmail: user.email });
    }
    else {
      res.render('authentication', { success: false, error: "Password or email is invalid" });
    }
  });
});


router.get('/wall', function(req, res, next) {
  res.render('wall', { success: req.session.success });
});


router.post('/register', function(req, res, next) {
  //Check validity
  req.check('email', 'Invalid email adress').isEmail();
  req.check('password', 'Password is invalid. Minimun characters is 4!').isLength({min: 4});

  var errors = req.validationErrors();
  if( errors)
  {
    req.session.errors = errors;
    req.session.success = false;
    res.redirect('/');
  }
  else
  {
    var newUser = User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password,
      email: req.body.email
    });

    newUser.save(function(err, user) {
      res.redirect('/authentication');
      console.log('User created!');
      console.log('Added user: '+user.firstName+ " " + user.lastName);
    });

  }

});

module.exports = router;
