/*jshint node: true, esversion: 6, devel: true */
var express = require('express');
var User = require('../Models/User');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'title' });
});

router.get('/authentication', function(req, res, next) {
  res.render('authentication', { title: 'Express' });
});
router.get('/wall', function(req, res, next) {
  res.render('wall', { title: 'Express' });
});


router.post('/users/:username', function(req, res, next) {
  var newUser = User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: req.body.password,
    email: req.body.email
  });

  newUser.save(function(err, user) {
    if (err) { throw err;}
    res.render('index', {err: err});
    console.log('User created!');
  });
});

module.exports = router;
