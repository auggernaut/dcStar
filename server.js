var url = require('url'),
   http = require('http'),
   https = require('https'),
   express = require('express'),
   request = require('request'),
   Sendgrid = require("sendgrid-web"),
    qs = require('querystring'),
   app = express(),
   star = require('./lib/star.js'),
    noflo = require("noflo");


var config = star.loadConfig();
console.log('Configuration');
console.log(config);

var PORT = process.env.PORT || config.star_port || 9999;
var DATABASE_URL = "http://" + config.couch_host + ':' + config.couch_port;

// reverse proxy for couchdb
app.use(function (req, res, next) {
   var proxy_path = req.path.match(/\/db(.*)$/);
   var token = req.path.match(/^\/t\/(.*)\/db\//);
   if (proxy_path && token) {
      var db_url = DATABASE_URL + proxy_path[1];
      var username = proxy_path[1].split("_")[1].split("/")[0];
      req.pipe(request({
         uri: db_url,
         method: req.method,
         headers: {
            "X-Auth-CouchDB-UserName": username,
            "X-Auth-CouchDB-Roles": "users",
            "X-Auth-CouchDB-Token": token[1]
         }
      })).pipe(res);
   } else {
      next();
   }
});

app.use(express.bodyParser());


app.listen(PORT, null, function (err) {
   if (err)
      console.log('Error: ' + err);
   console.log('Star, at your service: http://localhost:' + PORT);
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
   var referer = req.headers.referer;
   var app = req.body.app;
   var assertion = req.body.assertion;

    var graph;

    graph = new noflo.Graph("Connect")
    graph.addNode("Verify", "VerifyNaut");
    graph.addNode("Display", "Output");
    graph.addEdge("Verify", "out", "Display", "in");
    graph.addInitial(referer, "Verify", "domain");
    graph.addInitial("login.persona.org", "Verify", "idp");
    graph.addInitial(assertion, "Verify", "in");

/*    graph.addNode("Bind", "BindStar");
    graph.addNode("Token", "GetDBToken");
    graph.addEdge("Verify", "out", "Bind", "in");
    graph.addEdge("Bind", "out", "Token", "in");*/

    noflo.createNetwork(graph);

/*
   star.verify(referer, assertion, 'https://login.persona.org/verify', function (email) {

      if (email) {
         //Assertion accepted, i.e. user owns res.email

         star.provision(email, app, function (err, db) {
            if (!err) {

               star.auth(email, function (err, naut) {
                  if (!err) {
                     res.json({db: db, token: naut.token, naut: naut.id, email: email});
                  } else {
                     res.json({ error: "auth error: " + err });
                  }
               });

            } else {
               res.json({ error: "provision error: " + err });
            }
         });
      } else {
         res.json({ error: "invalid assertion" });
      }

   });*/

});


app.post('/dust', function (req, res) {
   console.log('/dust: ' + req.body.dust);

   star.getDust(req.body.app, req.body.naut, req.body.dust, function(err, dust){
      if (!err) {
         res.json(dust);
      } else {
         res.json({ error: "auth error: " + err });
      }
   })
});

app.post('/event', function(req, res){
    console.log('/event: ' + req.body.event);
    //check which kind of event, launch appropriate noflo graph

/*    noflo.loadFile("graphs/eventZi.fbp", function(network) {
        console.log("Graph loaded");
        return console.log(network.graph.toDOT());
    });*/

    var graph;

    graph = new noflo.Graph("Events")
    graph.addNode("Events", "PostEvent");
    graph.addNode("Display", "Output");
    graph.addEdge("Events", "out", "Display", "in");
    graph.addInitial("from Augustin", "Events", "from");
    graph.addInitial("to Becca", "Events", "to");
    noflo.createNetwork(graph);




});


app.post('/email', function(req, res){

    var email = req.body.email;

    var sendgrid = new Sendgrid({
        user: config.sendgrid_username,
        key: config.sendgrid_key
    });

    sendgrid.send({
        to: email.to,
        from: email.from,
        subject: email.subject,
        html: email.message
    }, function (err) {
        if (err) {
            res.json({status: "error", details: err});
        } else {
            res.json({status: "Success"});
        }
    });
});


app.post('/encode', function(req, res){

    var data = {
        input: req.body.url
    }

    var reqOptions = {
        host: 'app.zencoder.com',
        port: '443',
        path: '/api/v2/jobs',
        method: 'POST',
        headers: { "Zencoder-Api-Key": config.zencode_key }
    };

    var body = "";
    var req = https.request(reqOptions, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) { body += chunk; });
        res.on('end', function () {
            res.json({ job: "https://app.zencoder.com/jobs/" + qs.parse(body).id });
        });
    });

    req.write(data);
    req.end();
    req.on('error', function (e) {  res.json(e.message); });

});


app.post('/burst', function (req, res) {
   console.log("/burst");

});


app.post('/test', function (req, res) {

   var email = "augmandino@gmail.com";
   var app = "gratzi";

   star.provision(email, app, function (err, db) {
      if (!err) {
         star.auth(email, function (err, userCtx) {

            res.json(userCtx);

         });
      }
   });


});

