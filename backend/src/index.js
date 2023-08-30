import express from 'express';//package for web application feature
import passport from 'passport';//required middleware provided by Node.js for authentication
import bodyParser from 'body-parser';//Parse incoming request bodies in a middleware
import models from './models'//require the sequelize model
import cors from 'cors'; //allows restricted resources on a web page to 
//be requested from another domain outside the domain

const app = express();//initialize express call
app.use(require("body-parser").json());//handle the JSON request

app.use(function(err, req, res, next) {
  // ⚙️  function to catch errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.status(400).send({ code: 400, message: "bad request" });
    //return bad request message if the body is invalid
  } else next();
  //here code is for checking any request that not in require format
});

let port = process.env.PORT || 4000; //initialize default port
let secret_ = process.env.SECRET || "SECERT"; //initialize secret key

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

app.use(cors()); //cross origin resource sharing 

// force: true will drop the table if it already exits
// models.sequelize.sync({ force: true }).then(() => {
models.sequelize.sync().then(() => {
  console.log('Drop and Resync with {force: true}');
});

// passport middleware
app.use(passport.initialize());

// passport config
require('./config/passport')(passport);//passport auth setting for admin 
require('./config/clientpassport')(passport);//passport auth setting for client

//default route
app.get('/', (req, res) => res.send('Hello my World'));

//initialize the request handling end point
require('./routes/admin.js')(app); 
require('./routes/client.js')(app);

//create a server listening port
var server = app.listen(port, function() {
  var host = server.address().address;//listening uri
  var port = server.address().port;//listening port 

  console.log('App listening at http://%s:%s', host, port);
});
