/*jshint node: true, esversion: 6 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Express Validator
var expressValidator = require('express-validator');

//Express Session
var session = require('express-session');

//flash messages
var flash = require('connect-flash');

//passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//database
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/microfb');
var db = mongoose.connection;

//database session storing
var mongoStore = require('connect-mongo')(session);

//socket.io
var io = require('socket.io');

//view engine
var hbs = require('hbs');
hbs.registerHelper("formatDate", function(date){
  // This guard is needed to support Blog Posts without date
  // the takeway point is that custom helpers parameters must be present on the context used to render the templates
  // or JS error will be launched
  if (typeof(date) === "undefined") {
    return "Unknown";
  }
  // These methods need to return a String
  return date.getHours() + ":" + date.getMinutes() + " |  " + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();
});

var index = require('./routes/index');
var users = require('./routes/users');

//Init app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//session
app.set('sessionStore', new mongoStore({ mongooseConnection: mongoose.connection }));

app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true,
  store: app.get('sessionStore')
}));

//Passport init
app.use(passport.initialize());
app.use(passport.session());

//Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value)
  {
    var namespace = param.split('.'), root    = namespace.shift(), formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//Connect Flash
app.use(flash());


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.user || null;

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//Routes
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});



module.exports = app;
