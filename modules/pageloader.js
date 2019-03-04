var fs = require("fs");
var conf = JSON.parse(fs.readFileSync("./config.yml"));
var logger = require("../modules/logger.js");
exports.banned = conf.blackList;
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

module.exports = function(headers,socket){
    if(headers===true){return {"data":fs.readFileSync("sites/errors/maintenance.html"),"error":500};}
    var domain = "other";
    var file;
    var dir = headers['url'];
    if(headers['url']===undefined||headers['url']===null){return;}
    headers['url'] = ((headers['url'].indexOf("?")<=-1)?headers['url']:headers['url'].split("?")[0]);
    if(conf.blackList.indexOf(headers['client_address'].replace("::ffff:",""))>-1||exports.banned.indexOf(headers['client_address'].replace("::ffff:",""))>-1){logger.log(colors.reset+"["+colors.red+"BANNED"+colors.reset+"] "+"A banned user ["+headers['client_address']+"] attempted to load "+headers['url']);return {"data":fs.readFileSync("sites/errors/banned.html"),"error":403};}

    /* Arguments Code */
    var args={};
    try {
        if (!(dir.split("?").length <= 1)) {
            for (i = 0; i < dir.split("?")[1].split("&").length; i++) {
                var arg = dir.split("?")[1].split("&")[i];
                arg = arg.split("=");
                args[arg[0]] = arg[1];
            }
        }
    }catch(e){logger.error(e.toString());}

    var site_conf = conf['sites'][domain];
    if(site_conf===undefined){logger['access'](headers['client_address']+" - Invalid Host Requested - \"GET "+headers['url']+"\" HTTP/1.0\" 500"+" "+headers['user-agent']+" "+headers['host']);console.log("["+colors.red+"ERROR"+colors.reset+"] " + "Invalid host requested '"+domain+"' by "+headers['client_address']);return {"data":"Unknown host","error":501};}
    if(headers['url']===undefined){logger.error("URL is undefined");return {"data":"<b>Missing required header data.</b>","error":500}}
    if(site_conf['aliases']!==undefined&&site_conf['aliases'][headers['url'].split("/")[1]]!==undefined){console.log("Alias");site_conf['dir']=site_conf['aliases'][headers['url'].split("/")[1]];headers['url']=headers['url'].replace(headers['url'].split("/")[1],"");}
    if(site_conf!==undefined&&headers['url'].split("/").pop()===""){headers['url']=headers['url']+site_conf['default_file'];}
    if(args['q']!==undefined&&args['q']==="gay"){return {"data":"<b>No u</b>",error:500};}
    if(site_conf!==undefined&&fs.existsSync(site_conf['dir']+headers['url'])&&!fs.lstatSync(site_conf['dir']+headers['url']).isDirectory()){
        logger['access'](headers['client_address']+" - \"GET "+headers['url']+"\" HTTP/1.0\" 200 "+headers['host']+" "+((socket!==undefined)?socket.port:"[??]")+" "+headers['user-agent']);
        var page;
        if(headers['url'].toString().getExtension().toLowerCase()===("html"||"css"||"js")){
            page = fs.readFileSync(site_conf['dir']+headers['url']).toString('utf-8');
            var find = ["<%SERVER_BUILD%>","<%USER_IP%>", "<%SERVER_RPS%>","<%DIR%>","<%SERVER.TIME%>","<%SERVER.PORT%>","<%GET.Q%>"];
            var replace = [conf['build'],headers['client_address'], headers['rps'],dir,Date.now(),0,((args['q']!==undefined)?args['q']:'undefined')];
            page = page.replaceArray(find, replace);
        }else {
            page = fs.readFileSync(site_conf['dir']+headers['url']);
        }
        return {"data":page,"error":200}
    }else {
        console.log("["+colors.yellow+"WARN"+colors.reset+"] " + "404 Not Found '"+headers['url']+"' by "+headers['client_address']);
        logger['access'](headers['client_address']+" - \"GET "+headers['url']+"\" HTTP/1.0\" 404"+" "+headers['user-agent']+" "+headers['host']);
			page=fs.readFileSync("sites/errors/404.html").toString('utf-8');
            var find = ["<%SERVER_BUILD%>","<%USER_IP%>", "<%SERVER_RPS%>","<%DIR%>","<%SERVER.TIME%>","<%SERVER.PORT%>","<%GET.Q%>"];
            var replace = [conf['build'],headers['client_address'], headers['rps'],dir,Date.now(),0,((args['q']!==undefined)?args['q']:'undefined')];
            page = page.replaceArray(find, replace);
        return {"data":page,"error":404}
    }
};

String.prototype.getExtension = function() {
    return this.split(".").pop();
};
String.prototype.contains = function(str){return (this.indexOf(str)>=0);};
String.prototype.replaceArray = function(find, replace) {
    var replaceString = this;
    var regex;
    for (var i = 0; i < find.length; i++) {
        regex = new RegExp(find[i], "g");
        replaceString = replaceString.replace(regex, replace[i]);
    }
    return replaceString;
};
String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};

String.prototype.regexLastIndexOf = function(regex, startpos) {
    regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
    if(typeof (startpos) == "undefined") {
        startpos = this.length;
    } else if(startpos < 0) {
        startpos = 0;
    }
    var stringToWorkWith = this.substring(0, startpos + 1);
    var lastIndexOf = -1;
    var nextStop = 0;
    while((result = regex.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
};