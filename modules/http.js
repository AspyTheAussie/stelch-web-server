var net = require('net');
var fs = require("fs");
var pageloader = require("../modules/pageloader.js");
const {gzip, ungzip} = require('node-gzip');
var parser = require("../util/headerParse.js");
var logger = require("./logger.js");
var errors = require("../errors.js");
var conf = JSON.parse(fs.readFileSync("./config.yml"));
var file_decoder = require("../modules/file_decoder.js");
var colors = {
    "red":"\u001b[31m",
    "reset":"\u001b[0m",
    "green":"\u001b[32m",
    "yellow":"\u001b[33m",
    "blue":"\u001b[34m",
    "magenta":"\u001b[35m",
    "cyan":"\u001b[36m",
    "white":"\u001b[37m"
};

var sockets = [];
var port = 80;
var maintenance = false;

exports.maintenance = function(state){
    switch(state){
        case true:
            maintenance=true;
            logger.log(colors.reset+"["+colors.yellow+" MODE "+colors.reset+"] "+colors.red+"The server has entered maintenance mode, blocking all connections."+colors.reset);
            return true;
        case false:
            maintenance=false;
            logger.log(colors.reset+"["+colors.yellow+" MODE "+colors.reset+"] "+colors.green+"The server has exited maintenance mode, allowing connections."+colors.reset);
            return false;
        default:
            return maintenance;
    }
};

exports.start = function(logger) {
    var server = net.createServer(function(socket) {
        socket.on('data', function(data) {
            args = parser(data,socket);
            args['client_address']=socket.remoteAddress;
            qwe=pageloader(((maintenance)?true:args));

            if(!qwe){
                socket.write("HTTP/1.1 500 Internal Server Error\r\n"+
                    "Server: sws\r\n"+
                    ((site_conf&&site_conf['enforce_ssl'])?"Location: https://"+args['host']+"/"+args['url']+" \r\n":"")+
                    "X-Frame-Options: none\r\n"+
                    "Content-Encoding: gzip\r\n" +
                    "Content-Type: html"+
                    "\r\n");
                gzip(fs.readFileSync("sites/errors/maintenance.html")).then(function(compressed){
                    logger.log("["+colors.yellow+"DISCONNECT"+colors.reset+"] " + args['client_address'] + " Requested '" + args['url'] + " at " + Date.now() + " port " + port);
                    socket.write(compressed);
                    socket.write("\r\n\r\n");
                    socket.end(function(){
                        socket.destroy();
                    });
                });
                return;
            }

            var file_type;
            try {
                file_type = args['url'].split(".")[args['url'].split(".").length - 1];
            }catch (e){
                file_type="text/plain";
                logger.error(e.toString());
            }
            var site_conf = conf['sites'][args['host']];
            if(site_conf&&site_conf['enforce_ssl']===true){qwe['error']=301;}
            socket.write("HTTP/1.1 "+qwe['error']+" "+errors(qwe['error'])+"\r\n"+
                "Server: sws\r\n"+
                ((site_conf&&site_conf['enforce_ssl'])?"Location: https://"+args['host']+"/"+args['url']+" \r\n":"")+
                "X-Frame-Options: none\r\n"+
                "Content-Encoding: gzip\r\n" +
                "Content-Type: "+((qwe['error']===404||maintenance)?"text/html":((file_decoder[file_type]!==undefined)?file_decoder[file_type]:"text/plain"))+"\r\n"+
                "\r\n");
            //if(site_conf['enforce_ssl']===true){socket.write("\r\n");socket.end(()=>{socket.destroy();});return;}
            logger.log("["+colors.green+"CONNECT"+colors.reset+"] " + args['client_address'] + " Requested '" + args['url'] + " at " + Date.now() + " port " + port);

            gzip(qwe['data']).then(function(compressed){
                logger.log("["+colors.yellow+"DISCONNECT"+colors.reset+"] " + args['client_address'] + " Requested '" + args['url'] + " at " + Date.now() + " port " + port);
                socket.write(compressed);
                socket.write("\r\n\r\n");
                socket.end(function(){
                    socket.destroy();
                });
            });
        });
        socket.on('end', function() {
            removeSocket(socket);
        });
        socket.on('error', function(error) {
            logger.log("["+colors.red+"ERROR"+colors.reset+"] " + error.message);
        });
    });
    function removeSocket(socket) {
        sockets.splice(sockets.indexOf(socket), 1);
    }
    server.on('error', function(error) {
        logger.log("["+colors.red+"ERROR"+colors.reset+"] " + error.message);
    });
    server.listen(port, function() {
        console.log("["+colors.green+"STARTED"+colors.reset+"] " + "HTTP Handler has started on port "+port+" and is accepting connections.\r\n");
    });
};