var https = require('https');
var pageloader = require("../modules/pageloader.js");
const {gzip, ungzip} = require('node-gzip');
var requests=0;
var fs = require('fs');
var requests_user = {};
var rate_limits = {};
var logger = null;
var file_decoder = require("../modules/file_decoder.js");
var domain = null;
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

var port = "443";
var maintenance = false;
exports.rps=requests;
exports.maintenance = function(state){
    switch(state){
        case true:
            maintenance=true;
            logger.log(colors.reset+"["+colors.yellow+" MODE:SSL "+colors.reset+"] "+colors.red+"The server has entered maintenance mode, blocking all connections."+colors.reset);
            return true;
        case false:
            maintenance=false;
            logger.log(colors.reset+"["+colors.yellow+" MODE:SSL "+colors.reset+"] "+colors.green+"The server has exited maintenance mode, allowing connections."+colors.reset);
            return false;
        default:
            return maintenance;
    }
};

exports.start=function(local_logger,config){
    port=config['port'];
    domain=config['domain'];
    logger=local_logger;
    var options = {
        cert: fs.readFileSync(""+config['site']['SSL']['cert']),
        key: fs.readFileSync(""+config['site']['SSL']['key']),
        ca: fs.readFileSync(""+config['site']['SSL']['ca']),
        forever: true,
        keepalive:true,
        keep_alive:true
    };
    https.createServer(options, function(req, res) {
        try {
            res.setHeader("Server", "sws");
            res.setHeader("Content-Encoding", "gzip");
            res.setHeader("X-Frame-Options", "sameorigin");
            res.setHeader("Content-Type", "text/html");
            res.removeHeader('Date');
            res.removeHeader('Transfer-Encoding');
                headers = req['headers'];

            headers['url'] = req['url'];
            headers['client_address'] = res.connection.remoteAddress;

            requests_user[headers['client_address']]=((requests_user[headers['client_address']]!==undefined)?requests_user[headers['client_address']]+1:1);

            if(requests_user[headers['client_address']]>20){logger.log(colors.reset+"["+colors.red+"BLOCKED"+colors.reset+"] "+colors.cyan+"Blocked connection from "+headers['client_address']+" due to rate limit.");req.destroy();}
            setTimeout(function(){requests_user[headers['client_address']]=requests_user[headers['client_address']]-1;},5000);

            time=Date.now();
            logger.log("["+colors.green+"CONNECT:SSL"+colors.reset+"] " + headers['client_address'] + " Requested '" + headers['url'] + " at " + Date.now() + " port " + port + ((logger.level()===0)?(Date.now()-time)+"ms":""));

            requests++;
            var dir = headers['url'].split("/")[1];
            qwe = pageloader(((maintenance)?true:headers));
            file_type = headers['url'].split(".")[headers['url'].split(".").length - 1];
            if (qwe['error'] === 200) {
                res.setHeader("Content-Type", ((file_decoder[file_type] !== undefined) ? file_decoder[file_type] : "text/plain"));
            }
            res.writeHead(qwe['error']);
            gzip(qwe['data']).then(function(compressed){
                if(qwe['error']!==403)logger.log("["+colors.yellow+"DISCONNECT:SSL"+colors.reset+"] " + headers['client_address'] + " Requested '" + headers['url'] + " at " + Date.now() + " port " + port+ " RPM "+ (requests) + ((logger.level()===0)?(Date.now()-time)+"ms "+byteLength(compressed)+" bytes":""));
                res.write(compressed,()=>{
                    req.destroy();
                    res.destroy();
                    res.end(()=>{
                        if(qwe['error']!==403)if(logger.level()===0){logger.log(colors.reset+"["+colors.yellow+"CLOSED"+colors.reset+"] "+headers['client_address']+" has been closed after "+(Date.now()-time)+"ms");}
                        delete require.cache[require.resolve("./pageloader.js")];
                        delete pageloader;
                        delete require.cache[require.resolve("./api/handler.js")];
                    });
                });
                setTimeout(function(){requests--;},60000);
            });
        }catch (e){
            logger.log(e.toString());
        }
    }).listen(port).on("error",(err)=>{console.log(err);});
    console.log("["+colors.green+"STARTED"+colors.reset+"] " + "HTTPS Handler has started on port "+port+" and is accepting connections. ");
};

function byteLength(str) {
    return encodeURI(str).split(/%..|./).length - 1;
}