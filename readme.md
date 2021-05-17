# Deploy Agent

## Description

> Deply and manage services via HTTP API

> Autodetect build targets when deploying via the oscarlundberg/deploy package (Coming Soon)

## Quick Start
### Install
1. Paste this command into the terminal
    ```sh
    if cd ~/deploy-agent; then
        git pull;
    else
        git clone https://github.com/OscarLundberg/deploy-agent.git ~/deploy-agent;
    fi
    sudo sh ~/deploy-agent/setup.sh;
    ```

    > This command will:
    > - Create or update the ~/deploy-agent repository
    > - install node modules
    > - Create and run deploy-agent as a service


2. To make sure that the service is up and running, paste and run:
    ```sh
    curl localhost:49494/deploy-agent/get/online
    # Should output: Online
    ```

### Usage

Once installed you can consume the API directly or via the [/oscarlundberg/deploy](./oscarlundberg/deploy) package.

## API Reference

### GET
- [/deploy-agent/get/info](/deploy-agent/get/info) - **Information about the machine running this agent**
- [/deploy-agent/get/status](/deploy-agent/get/status) - **Status of services running under this agent**
- [/deploy-agent/get/list](/deploy-agent/get/list) - **Get a list of services running under this agent**
- [/deploy-agent/get/help](/deploy-agent/get/help) - **Display this help page**
- [/deploy-agent/get/online](/deploy-agent/get/online) - **Is agent running (Used by oscarlundberg/deploy network scanner)**
- [/deploy-agent/get/logs?name=myName](/deploy-agent/get/logs) - **Get logs for service**
### POST
- [/deploy-agent/post/deploy](/deploy-agent/post/deploy) - **Deploy a new service - [Structure](#structure)**
- [/deploy-agent/post/update](/deploy-agent/post/update) - **Update an existing service - [Structure](#structure)**
- [/deploy-agent/post/reload](/deploy-agent/post/reload) - **Force a running service to reload - `{"name":""}`**
- [/deploy-agent/post/kill](/deploy-agent/post/kill) - **Kill a running service - `{"name":""}`**
- [/deploy-agent/post/upgrade](/deploy-agent/post/upgrade) - **Upgrade the service (Requires "upgrade" property to be specified either in service declaration or in request body) - `{"name":"", "upgrade?":""}`**
### DELETE
- [/deploy-agent/delete/service](/deploy-agent/delete/service) - **Delete the service (*Alpha*: The service declaration and home directory will be kept as a backup, but the service will be unlinked and moved) `{"name":""}`**


#### Structure

```
{
    "from": "https://github.com/OscarLundberg/deploy-agent.git", // Link to git repo - *
    "cmd": "cd $CWD; npm run start",                             // Command to execute in order to run service - * $
    "name": "dirTest",                                           // Name/Label for the service (Should be URL-safe) - *
    "before": [""],                                              // Commands to run before deploying.    Default: ["git clone $FROM"] - $
    "upgrade": "",                                               // Command to run when upgrading. - $
    "runMode": "service",                                        // Run mode for the service.            Default: "service"
    "restart": "always",                                          // Restart mode for the service.        Default: "restart"
    "to": "myself"                                               // Alias for current deploy-agent
}
```

>\* - Required


> $ - Exposes variables.


```php
$CWD     :   service home directory
$NAME    :   service name
$FROM    :   service repository url
```