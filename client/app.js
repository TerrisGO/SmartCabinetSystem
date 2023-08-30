var express = require('express');
var path = require('path');
var logger = require('morgan');
var index = require('./routes/index');
var app = express();
var isJSON = require('is-json');
let functionCallApi = require("./routes/callApi");
var bodyParser = require('body-parser');

setInterval(myFunctionLoop, 1000 * 60 * 60* 23);//Every 23 hours run this
//to actively refresh the token making sure client able to connect to the server
function myFunctionLoop(){
  functionCallApi.callLogin();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
// set path for static assets
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.render('error', {status:err.status, message:err.message});
});

module.exports = app;
//console.log(process.versions)