/*jshint node: true, esversion: 6, devel: true */
var express = require('express');
var User = require('../Models/User');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  //Przesyłam success i errory validacji
  res.render('index', { });
  //Resetuje errory po renderze widoku
});

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
  res.render('wall', { title: 'Express' });
});

module.exports = router;
