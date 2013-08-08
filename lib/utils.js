var fs = require('fs');

// Load config defaults from JSON file.
// Environment variables override defaults.
exports.loadConfig = function loadConfig() {
   var config = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf-8'));
   for (var i in config) {
      config[i] = process.env[i.toUpperCase()] || config[i];
   }
   console.log('Configuration');
   console.log(config);
   return config;
};