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
            <li>/deploy-agent/get/online - <small>Is agent running</small></li>
            <li>/deploy-agent/get/info - <small>Information about the machine running this agent</small></li>
            <li>/deploy-agent/get/status - <small>Status of services running under this agent</small></li>
            <li>/deploy-agent/get/help - <small>Display this help page</small></li>
        </ul>
        <h3>POST</h3>
        <ul>
            <li>/deploy-agent/post/deploy - <small>Deploy a new service</small></li>
            <li>/deploy-agent/post/update - <small>Update an existing service</small></li>
            <li>/deploy-agent/post/reload - <small>Force a running service to reload (auto updates if specified in the run behaviour)</small></li>
            <li>/deploy-agent/post/kill - <small>Kill a running service</small></li>
        </ul>
        `
    );
})

app.use(express.json())

app.post('/deploy-agent/post/update', (req, res) => {

})

app.post('/deploy-agent/post/deploy', (req, res) => {
    try {
        let services = readToObject("./services.json");
        console.log(services);
        let input = req.body;
        let validation = validate(input, services);
        if (validation.success) {
            let list = [...services, req.body];
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

    console.log(service);
    let parsedCommand = service.cmd.replace("$CWD", homeDir);

    let clone = [`cd $CWD; git clone ${service.from} .`]
    let before = (Array.isArray(service.before) ? service.before : clone);


    before.map(e => e.replace("$CWD", homeDir))
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


function getStatus(nm = "__ALL__SERVICES__") {
    let services = [];
    if (nm == "__ALL__SERVICES__") {
        for (let service of readToObject("services.json")) {
            services += status(service);
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