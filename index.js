var fs = require('fs')
const path = require('path');
var express = require('express');
var os = require('os');
const { json } = require('express');
const crypto = require('crypto');
const { exec, execSync } = require('child_process');
var app = express();

function sha1(inp) {
    return crypto.createHmac("sha1", JSON.stringify(inp))
        .digest("hex")
}

function userAgent() {
    return {
        "hostname": os.hostname(),
        "os": os.type(),
        "freeMemory": Math.floor((os.freemem() / 1024) / 1024) + " mb",
        "uptime": Math.floor((os.uptime() / 60) / 60) + " h",
        "serviceDir": (os.type() === "Darwin") ?
            path.resolve(__dirname + "/service_declarations") :
            path.resolve("/etc/systemd/system"),
        ...os.userInfo()
    }
}

services = () => readToObject('services.json');



app.get('/deploy-agent/get/online', (req, res) => {
    res.status(200).send("Online");
})

app.get('/deploy-agent/get/info', (req, res) => {
    res.status(200).send(userAgent())
})

app.get('/deploy-agent/get/status', (req, res) => {
    res.status(200).send(getStatus());
})

app.get('/deploy-agent/get/help', (req, res) => {
    res.send(
        `
        <h3>GET</h3>
        <ul>
            <li>/deploy-agent/get/online - <small>Is agent running</small><a href="#structure">Structure</a></li>
            <li>/deploy-agent/get/info - <small>Information about the machine running this agent</small></li>
            <li>/deploy-agent/get/status - <small>Status of services running under this agent</small></li>
            <li>/deploy-agent/get/help - <small>Display this help page</small></li>
        </ul>
        <h3>POST</h3>
        <ul>
            <li>/deploy-agent/post/deploy - <small>Deploy a new service</small></li>
            <li>/deploy-agent/post/update - <small>Update an existing service</small></li>
            <li>/deploy-agent/post/reload - <small>Force a running service to reload</small></li>
            <li>/deploy-agent/post/kill - <small>Kill a running service</small></li>
            <li>/deploy-agent/post/upgrade - <small>Upgrade the service (Requires "upgrade" property to be specified either in service declaration or in request body)</small></li>
        </ul>
        <h3>DELETE</h3>
        <ul><li>'/deploy-agent/delete/service' - <small>Delete the service* (<b>Alpha</b>: The service declaration and home directory will be kept as a backup, but the service will be unlinked and moved)</small></li>
        </ul>
        <h4 id="structure">Structure</h4>
        <code>
        <pre>
        {
            "from": "https://github.com/OscarLundberg/deploy-agent.git", : Link to git repo - <b>*</b>
            "cmd": "cd $CWD; npm run start",                             : Command to execute in order to run service - <b>* $</b>
            "name": "dirTest",                                           : Name/Label for the service (Should be URL-safe) - <b>*</b>
            "before": [""],                                              : Commands to run before deploying.    Default: ["git clone $FROM"] - <b>$</b>
            "upgrade": "",                                               : Command to run when upgrading. - <b>$</b>
            "runMode": "service",                                        : Run mode for the service.            Default: "service"
            "restart": "always"                                          : Restart mode for the service.        Default: "restart"
            "to": "myself"                                               : Alias for current deploy-agent
        }
        </pre></code>
        <div>* - Required</div>
        <div>$ - Exposes variables.
        <code>
        <pre>
        $CWD     :   service home directory
        $NAME    :   service name
        $FROM    :   service repository url
        </pre>
        </code>
        </div>
        `
    );
})

app.use(express.json())

app.post('/deploy-agent/post/update', (req, res) => {
    let serviceList = services();
    let input = req.body;
    let name = req.body.name;
    let target = serviceList.filter(e => e.name == name);
    if (target.length <= 0) {
        res.status(400).send("Service not found");
    } else {
        let index = serviceList.indexOf(target[0]);
        serviceList[index] = { ...target[0], ...input };
        writeToFile('services.json', serviceList);
    }
})

app.post('/deploy-agent/post/upgrade', (req, res) => {
    let serviceList = services();
    let name = req.body.name;
    let target = serviceList.filter(e => e.name == name);
    let output;
    if (target.length <= 0) {
        res.status(400).send("Service not found");
    } else {
        let homeDir = path.resolve(__dirname + "/service_home/" + target.name);

        try {
            let command = req.body.upgrade || target.upgrade;
            output = execSync(replaceWildcards(command, homeDir, target));
        } catch (err) {
            res.status(400).send(err);
        }
    }
    res.status(200).send("OK - " + output);
});


app.post('/deploy-agent/post/deploy', (req, res) => {
    try {
        let input = req.body;
        let serviceList = services();
        let validation = validate(input, serviceList);
        if (validation.success) {
            let list = [...serviceList, req.body];
            writeToFile('./services.json', list);
            res.status(200).send("OK");
        } else {
            res.status(400).send("ERROR CODE " + validation.code + "\n" + validation.error);
        }

    } catch (err) {
        console.log(err);
        res.status(400).send("Bad Request")
    }
});

app.post('/deploy-agent/post/reload', (req, res) => {
    res.status(200).send(runService(req.body.name))
})

app.post('/deploy-agent/post/kill', (req, res) => {
    res.status(200).send(runService(req.body.name))
})

app.post('/deploy-agent/post/start', (req, res) => {
    let inp = req.body.name;
    start(inp);
    res.status("200").send("OK")
})

app.delete('/deploy-agent/delete/service', (req, res) => {
    let inp = req.body.name;
    let result = removeService(inp);
    if (result.success) {
        res.status(200).send("OK");
    } else {
        res.status(400).send(result.error);
    }
});



app.listen(49494, () => {
    console.log("server listening on localhost:49494");
})

function start(re = /.*/g) {
    let serviceList = readToObject("services.json").filter(e => e.name.match(re));
    serviceList.forEach(service => {
        makeService(service);
    })
}

function readToObject(file) {
    if (fs.existsSync(file)) {

        return JSON.parse(fs.readFileSync(file).toString())
    } else {
        fs.writeFileSync(file, "[]")
        return readToObject(file);
    }
}

function writeToFile(file, json) {
    fs.writeFileSync(file, JSON.stringify(json));
}

function validate(inp, services) {
    let success = true;
    let error = ""

    // Check input structure
    {
        let requiredKeys = ["from", "cmd", "name"]
        requiredKeys.forEach(key => {
            if (!inp.hasOwnProperty(key)) {
                success = false;
                error += `\n- Missing required property "${key}"`;
            }
        })

        if (!success) {
            return { success: false, error, code: 1 };
        }
    }

    if (services.some(e => sha1(e) == sha1(inp))) {
        return { success: false, error: "Checksum match - This service is already deployed. Did you mean to request '/agent_deploy-reload'?", code: 2 }
    } else if (services.some(e => e.name == inp.name)) {
        return { success: false, error: "Service name taken. To update the service, use '/agent_deploy-update'", code: 3 }
    }
    return { success, error: "", code: 0 }
}

function makeService(service) {
    let homeDir = path.resolve(__dirname + "/service_home/" + service.name);
    let declaration = path.resolve(userAgent().serviceDir + "/");
    try {
        fs.mkdirSync(homeDir, { "recursive": true });
        fs.mkdirSync(declaration, { "recursive": true });
    } catch { }

    let parsedCommand = replaceWildcards(service.cmd, homeDir, service);

    let clone = [`cd $CWD; git clone ${service.from} .`]
    let before = (Array.isArray(service.before) ? service.before : clone);


    before.map(e => replaceWildcards(e, homeDir, service))
        .forEach(cmd => {
            console.log(`Executing ${cmd}`);
            execSync(cmd);
        })

    let template =
        `[Unit]
Description=${service.name}
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=${service.restart || "always"}
RestartSec=1
User=${userAgent().username}
ExecStart=${parsedCommand}

[Install]
WantedBy=multi-user.target`

    fs.writeFileSync(declaration + "/" + service.name + ".service", template);
    [`systemctl daemon-reload`, `systemctl enable ${service.name}.service`].forEach(cmd => {
        execSync(cmd);
    })
}

function removeService(nm) {

    let serviceList = services();


    let declaration = path.resolve(userAgent().serviceDir + "/" + nm + ".service");
    if (fs.existsSync(declaration)) {
        stopService(nm);
        try {

            serviceList = services().filter(e => e.name == nm);
            writeToFile('services.json', serviceList);

            fs.copyFileSync(declaration, path.resolve(__dirname + "/service_declarations/" + nm + "_backup_" + new Date().toLocaleDateString()));
            fs.rmSync(declaration);
            return { success: true, error: "" }
        } catch (err) {
            return { success: false, error: err };
        }
    }
    return { success: false, error: "Service not found" };
}


function getStatus(nm = "__ALL__SERVICES__") {
    let serviceList = [];
    if (nm == "__ALL__SERVICES__") {
        for (let service of services()) {
            serviceList += status(service);
        }
    } else {
        return execSync(`systemctl status ${nm}.service`).toString()
    }
    return services;
}

function runService(nm) {
    return execSync(`systemctl start ${nm}.service`).toString()
}

function stopService(nm) {
    return execSync(`systemctl stop ${nm}.service`).toString()
}


function logs(nm) {
    return execSync(`journalctl -u ${nm}.service`).toString()
}

function replaceWildcards(str, home, service) {
    return str.replace(/\$CWD/g, home).replace(/\$NAME/g, service.name).replace(/\$FROM/g, service.from);
}
