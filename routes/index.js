/*jshint node: true */
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/authentication', function(req, res, next) {
  res.render('authentication', { title: 'Express' });
});

router.get('/wall', function(req, res, next) {
  res.render('wall', { title: 'Express' });
});

module.exports = router;
