var Sendgrid = require("sendgrid-web");


exports.email = function sendEmail(config, json, cb) {

   var sendgrid = new Sendgrid({
      user: config.sendgrid_username,
      key: config.sendgrid_key
   });

   sendgrid.send({
      to: json.to,
      from: json.from,
      subject: json.subject,
      html: json.message
   }, function (err) {
      if (err) {
         cb(err);
      } else {
         cb(null, "Success");
      }
   });
};