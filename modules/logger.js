var fs=require("fs");
var listeners = [];
/*
* 0 // Full Debug
* 1 // Basic Information
* 2 // ??
*/
var log_level = 0;

module.exports = {
    'add':function(e){listeners.push(e);},
    'listeners':{
        'send':function(msg){for(i=0;i<listeners.length;i++){listeners[i].log(msg);}},
        'list':function(){return listeners;}
    },
    'log':function (msg) {
        for(i=0;i<listeners.length;i++){
            listeners[i].log(msg);
        }
        console.log(msg);
        fs.writeFileSync("./logs/console.log", fs.readFileSync("./logs/console.log")+"["+Date()+"] "+msg+"\r\n");
    },
    'access':function(msg){fs.writeFile("./logs/access.log", fs.readFileSync("./logs/access.log")+"["+Date()+"] "+msg+"\r\n",function(err){if(err){return console.log(err);}});},
    'error':function(msg){fs.writeFile("./logs/error.log", fs.readFileSync("./logs/error.log")+"["+Date()+"] "+msg+"\r\n",function(err){if(err){return console.log(err);}});},
    'forbidden':function(msg){fs.writeFile("./logs/forbidden.log", fs.readFileSync("./logs/forbidden.log")+"\r\n["+Date()+"] "+msg,function(err){if(err){return console.log("\u001b[31m"+err);}});},
    'level':function(level){if(level===undefined){return log_level;}if(!isNaN(level)){log_level=level;}else{this.error("Called setLevel without valid number.")}}
};