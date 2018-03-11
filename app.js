var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helper = require('./helper.js'); // my functions are in helper.js
var myData = require('./routes/myData');

var app = express();

// Here is where I call my app, setting up a cron job so it calls main once per day at 10pm
var CronJob = require('cron').CronJob;
new CronJob('0 22 * * *', () => {
  helper.main();
}, null, true)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

<<<<<<< HEAD
//app.use('/', glabs);
||||||| merged common ancestors
app.use('/', glabs);
=======
app.use('/', myData);
>>>>>>> 5bc686761906bd16f5dbc9c316576bf85ad0ff54

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
