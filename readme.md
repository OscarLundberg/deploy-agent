# Deploy Agent
Allows autodetection for deployment via the deploy package

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