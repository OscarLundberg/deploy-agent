var express = require('express');
var os = require('os');
var app = express();

function userAgent() {
    return {
        "hostname": os.hostname(),
        "homeDirectory": os.homedir(),
        "freeMemory": Math.floor((os.freemem() / 1024) / 1024) + " mb",
        "uptime": Math.floor((os.uptime() / 60) / 60) + " h"
    }
}


app.get('/deploy-agent_online', (req, res) => {
    res.status(200).send();
})

app.get('/deploy-agent_info', (req, res) => {
    res.status(200).send(userAgent())
})

app.post('/deploy-agent_deploy', (req, res) => {
    
});

app.listen(49494, () => {
    console.log("server listening on localhost:49494");
 })
