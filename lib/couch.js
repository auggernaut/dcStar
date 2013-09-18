var q = require('q');
var nano;

/*
 * Recommended CouchDB .ini settings
 *
 * [httpd]
 * enable_cors = true
 * authentication_handlers = {couch_httpd_auth, proxy_authentification_handler},{couch_httpd_auth, cookie_authentication_handler},{couch_httpd_auth, default_authentication_handler}
 *
 * [couch_httpd_auth]
 * allow_persistent_cookies = true
 *
 * [cors]
 * credentials = true
 * origins = http://localhost
 * headers = accept, authorization, content-type, origin
 * methods = GET, POST, PUT, HEAD, DELETE
 *
 */


exports.load = function (config) {
   nano = require('nano')("http://" +
      config.couch_admin + ":" +
      config.couch_pass + "@" +
      config.couch_host + ':' +
      config.couch_port);
}


exports.proxyAuth = function (host, username, roles, token, cb) {

   require('nano')(host).request({
         method: "GET",
         db: "_session",
         headers: {"X-Auth-CouchDB-UserName": username, "X-Auth-CouchDB-Roles": roles, "X-Auth-CouchDB-Token": token}
      },
      function (err, body) {

         if (err) {
            cb(err, null);
         }
         else {
            cb(null, body);
         }
      });
}


/*
 * insert dust into the database
 *
 * @param {dust:object} dust object to be inserted
 * @param {app:string} name of application
 * @param {creds:object} credentials
 *
 */
exports.insertDoc = function (doc, app, creds, cb) {

   var appDB = nano.use(creds.username + "_" + app);

   appDB.insert(doc, function (err, res) {
      if (err) {
         console.log(err);
         cb("failed", null);
      }
      else {
         cb(null, res);
      }
   });
}


/*
 * gets dust from the database by params
 *
 * @param {name:string} name of user
 *
 */
exports.getDoc = function (app, user, doc, cb) {

   var appDB = nano.use(app + "_" + user);

   appDB.get(doc, function (err, res) {
      if (err) {
         console.log(err);
         cb(err.error, null);
      }
      else {
         cb(null, res);
      }
   });
}


/*
 * lists user from the database that match params
 *
 * @param {config:object} couchdb config
 * @param {params:object} search by parameters
 *
 */
exports.listDocs = function (app, params, cb) {

   var users = nano.use(app);

   users.list(params, function (err, docs) {
      if (err) {
         console.log(err);
         cb("failed", null);
      }
      else {
         cb(null, docs);
      }
   });
}


/*
 * gets a user from the database by username
 *
 * @param {username:string} name of document in _users
 *
 */
exports.getUser = function (username, cb) {

   var users = nano.use("_users");

   users.get("org.couchdb.user:" + username, function (err, user) {
      if (err) {
         console.log("getUser error: " + err.error);
         cb(err, null);
      }
      else {
         cb(null, user);
      }
   });
}


/*
 * creates user
 *
 * @param {creds:object} credentials
 *
 */
exports.createUser = function (username, email, cb) {

   var users = nano.use("_users");

   var user = {
      _id: "org.couchdb.user:" + username,
      name: username,
      roles: [],
      type: "user",
      email: email
   };

   users.insert(user, user._id, function (err, res) {
      if (err) {
         cb(new Error("Error message: " + err.message, null));
      }
      else {
         cb(null, res);
      }
   });

};


/*
 * creates database for app, apply security settings of user
 *
 * @param {app:string} name of application
 * @param {creds:object} credentials
 *
 */
exports.createDB = function (app, user, cb) {

   var dbname = app + "_" + user;
   var userDB = nano.use(dbname);
   var secObj = {
      admins: {
         names: [],
         roles: []
      },
      members: {
         names: [user],
         roles: []
      }
   };

   nano.db.create(dbname, function (err, body) {
      if (err && err.error === "file_exists") {
         cb(null, dbname);
      }
      else if(err){
         cb({error: err}, null);
      }
      else {
         userDB.insert(secObj, "_security", function (err, body) {
            if (err) {
               cb({error: err}, null);
            }
            else {
               cb(null, dbname);
            }
         });
      }
   });

};


