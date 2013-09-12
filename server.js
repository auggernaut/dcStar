var url = require('url'),
   http = require('http'),
   https = require('https'),
   express = require('express'),
   request = require('request'),
   app = express(),
   message = require('./lib/message.js'),
   utils = require('./lib/utils.js'),
   couch = require('./lib/couch.js');


var config = utils.loadConfig();
var port = process.env.PORT || config.stardust_port || 9999;
var DATABASE_URL = "http://" + config.couch_host + ':' + config.couch_port;

// reverse proxy for couchdb
app.use(function (req, res, next) {
   var proxy_path = req.path.match(/^\/db(.*)$/);
   if (proxy_path) {
      var db_url = DATABASE_URL + proxy_path[1];
      req.pipe(request({
         uri: db_url,
         method: req.method
      })).pipe(res);
   } else {
      next();
   }
});

app.use(express.bodyParser());


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




app.post('/connect', function (req, res) {
   console.log("/connect");
   var app = req.headers.referer;
   var assertion = req.body.assertion;

   if (assertion) {
      //AUTH WITH PERSONA
      request.post({
         url: 'https://login.persona.org/verify',
         json: {
            assertion: assertion,
            audience: app
         }
      }, function (e, r, body) {
         if (body && body.email) {
            //Assertion accepted, user owns body.email


            //Lookup user/app
            //If user/db don't exist
               //Create user/db

            //Proxy Authenticate with DB
            //Return userCtx


            res.json({ success: body.email });
         } else {
            res.json({ success: false });
         }
      });
   } else {
      res.json({ success: false });
   }


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


app.post('/dust', function (req, res) {
   var dust = req.body.dust;

   console.log('get dust: ' + dust);

   couch.getDust(req.body.app, req.body.user, dust, function (err, dust) {
      res.json(err ? { error: err } : dust);
   });

});


app.post('/burst', function (req, res) {
   console.log("/burst");

});



