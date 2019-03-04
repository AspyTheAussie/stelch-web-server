module.exports = function (headers,url) {
    headers=(headers+"\r\n").split("\r\n");

    found_get=false;
    req = {};
    for(i=0;headers.length>i;i++){
        if(headers[i].toString().split(" ")[0]==="GET"){req['url']=headers[i].toString().split(" ")[1];}

        var header = headers[i].toString().split(":")[0];
        var value = headers[i].toString().split(":")[1];
        if(value===undefined){continue;}else{header=header.toLowerCase().replace(" ","");value=value.toLowerCase().replace(' ','');}
        req[header.toLowerCase()]=value.toLowerCase();
    }

    return req;
};