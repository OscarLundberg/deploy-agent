# Deploy Agent
> Deply and manage services via HTTP API

> Autodetect build targets when deploying via the oscarlundberg/deploy package (Coming Soon)

<h3>GET</h3>
<ul>
    <li>/deploy-agent/get/online - <small>Is agent running</small></li>
    <li>/deploy-agent/get/info - <small>Information about the machine running this agent</small></li>
    <li>/deploy-agent/get/status - <small>Status of services running under this agent</small></li>
    <li>/deploy-agent/get/help - <small>Display this help page</small></li>
</ul>
<h3>POST</h3>
<ul>
    <li>/deploy-agent/post/deploy - <small>Deploy a new service - <a href="#structure">Structure</a></small></li>
    <li>/deploy-agent/post/update - <small>Update an existing service - <a href="#structure">Structure</a></small></li>
    <li>/deploy-agent/post/reload - <small>Force a running service to reload</small></li>
    <li>/deploy-agent/post/kill - <small>Kill a running service</small></li>
    <li>/deploy-agent/post/upgrade - <small>Upgrade the service (Requires "upgrade" property to be specified either in service declaration or in request body)</small></li>
</ul>
<h3>DELETE</h3>
<ul><li>'/deploy-agent/delete/service' - <small>Delete the service* (<b>Alpha</b>: The service declaration and home directory will be kept as a backup, but the service will be unlinked and moved)</small></li>
</ul>
<h4 id="structure">Structure</h4>
<code><pre>
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