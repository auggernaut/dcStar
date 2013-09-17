var fs = require('fs'),
   request = require('request'),
   couch = require('./couch.js'),
   crypto = require('crypto'),
   config;


// Load config defaults from JSON file.
// Environment variables override defaults.
exports.loadConfig = function loadConfig() {
   config = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf-8'));
   for (var i in config) {
      config[i] = process.env[i.toUpperCase()] || config[i];
   }

   couch.load(config);
   return config;
};


exports.verify = function verify(app, assertion, idp, cb) {

   if (app && assertion) {

      request.post({
         url: idp,
         json: {
            assertion: assertion,
            audience: app
         }
      }, function (e, r, body) {
         if (body && body.email) {
            //Assertion accepted, user owns body.email

            cb(body.email);

         } else {
            cb(null);
         }
      });
   } else {
      cb(null);
   }

};


exports.provision = function provision(email, app, cb) {

   //TODO: Only clients of an approved app can register

   var nautId = crypto.createHash('md5').update(email).digest("hex");


   couch.getUser(nautId, function (err, user) {

      //user must exist before creating db.
      if (!user) {

         couch.createUser(nautId, email, function (err, user) {
            couch.createDB(app, nautId, function (err, dbname) {
               cb(err, dbname);
            });

         });

      } else {
         couch.createDB(app, nautId, function (err, dbname) {
            cb(err, dbname);
         });
      }

   });

};


exports.auth = function (email, cb) {

   var nautId = crypto.createHash("md5").update(email).digest("hex")
      , roles = "users"
      , secret = config.couch_secret
      , token = crypto.createHmac("sha1", secret).update(nautId).digest('hex')
      , host = "http://" + config.couch_host + ':' + config.couch_port;

   //run proxyAuth just to make sure token works.
   couch.proxyAuth(host, nautId, roles, token, function (err, res) {

      if (res.userCtx && res.userCtx.name) {
         cb(null, { token: token, id: nautId });
      }
      else {
         cb("failed to authenticate", null);
      }

   });

};

exports.getDust = function(app, naut, dust, cb){

   couch.getDoc( app, naut, dust,
      function (err, dust) {

         if (!err) {
            cb(null, dust);
         }
         else {
            cb("failed to get dust: " + err, null);
         }

      }
   );

}


/*
 * gets the database url of a user
 *
 * @param {username:string} name of user
 * @param {appname:string} name of app
 *
 */
exports.getUserDB = function (username, appname) {

   return "http://" + config.couch_host + ':' + config.couch_port + "/" + username + "_" + appname;
}
