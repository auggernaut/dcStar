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
var port = process.env.PORT || config.stardust_port || 9999;


app.listen(port, null, function (err) {
   if (err)
      console.log('Error: ' + err);
   console.log('StarDust, at your service: http://localhost:' + port);
});


// Convenience for allowing CORS on routes
app.all('*', function (req, res, next) {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Methods', 'GET, POST');
   res.header('Access-Control-Allow-Headers', 'Content-Type');
   next();
});


app.post('/register', function (req, res) {
   console.log("/register");

   //TODO: Only clients of an approved app can register
   //if (req.body.appSecret === config.appSecret) {

   //create User
   couch.createUser(req.body.creds, function (err, user) {

      //create DB
      couch.createDB(req.body.app, req.body.creds, function (err, dbname) {
         res.json(err ? { error: err } : { db: dbname });
      });
   });

   //}
});


app.post('/lookup', function (req, res) {
   console.log("/lookup");

   res.json({ db: couch.getUserDB(req.body.user, req.body.app) });

});


app.post('/message', function (req, res) {
   console.log("/sync");

});


app.post('/dust', function (req, res) {
   var dust = req.body.dust;
   var dbname = couch.getUserDB(req.body.user, req.body.app);
   console.log('get dust: ' + dust + " from: " + dbname);

   couch.getDust(dbname, dust, function (err, dust) {
      res.json(err ? { error: err } : { dust: dust});
   });

});

