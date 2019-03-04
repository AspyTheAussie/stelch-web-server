var http = require("./modules/http");
var https = require("./modules/https");
var logger = require("./modules/logger.js");
var fs = require("fs");
var config = JSON.parse(fs.readFileSync("config.yml"));

http.start(logger);
https.start(logger,{"port":443,"site":config['sites']['other']});
