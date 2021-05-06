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
    <li>/deploy-agent/post/deploy - <small>Deploy a new service</small></li>
    <li>/deploy-agent/post/update - <small>Update an existing service</small></li>
    <li>/deploy-agent/post/reload - <small>Force a running service to reload</small></li>
    <li>/deploy-agent/post/kill - <small>Kill a running service</small></li>
    - /deploy-agent/post/upgrade - Upgrade the service (Requires "upgrade" property to be specified either in service declaration or in request body)
</ul>
<h3>DELETE</h3>
<ul><li>'/deploy-agent/delete/service' - <small>Delete the service* (<b>Alpha</b>: The service declaration and home directory will be kept as a backup, but the service will be unlinked and moved)</small></li>
</ul>