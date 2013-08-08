var url = require('url'),
   http = require('http'),
   https = require('https'),
   express = require('express'),
   app = express(),
   message = require('./lib/message.js'),
   utils = require('./lib/utils.js'),
   couch = require('./lib/couch.js');

app.use(express.bodyParser());

var config = utils.loadConfig();
var port = process.env.PORT || config.port || 9999;
var domain = "http://" + config.couch_host + ':' + config.couch_port;


app.listen(port, null, function (err) {
   if (err)
      console.log('Error: ' + err);
   console.log('StarDust, at your service: http://localhost:' + port);
});


// Convenience for allowing CORS on routes - GET only
app.all('*', function (req, res, next) {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Methods', 'GET, POST');
   res.header('Access-Control-Allow-Headers', 'Content-Type');
   next();
});


app.post('/register', function (req, res) {
   console.log("/register");

   //TODO: replace with OAuth2 implementation
   //Only clients of an approved StarCore app can register
   if (req.body.appSecret === config.appSecret) {

      //create User
      couch.createUser( req.body, function (err, user) {

         //create DB
         couch.createDB(config.appName, req.body, function (err, dbname) {
            res.json(err ? err : {url: domain + "/" + dbname});
         });
      });
   }
});




app.post('/login', function (req, res) {
   console.log("/login");

   couch.getUser(req.body.username, function (err, user) {
      if (user) {
         if (req.body.password === user.password) {    //TODO: hash before compare
            res.json({url: domain + "/" + req.body.username + "_" + config.appName});
         } else {
            res.json({error: "invalid credentials"});
         }
      } else if (err) {
         res.json(err);
      } else {

      }
   });


});




app.post('/message', function (req, res) {
   console.log("/sync");

});


app.get('/get/:doc', function (req, res) {
   var code = req.params.code;
   console.log('doc/' + code);

});

