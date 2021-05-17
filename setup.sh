#!/bin/bash
CDIR=$PWD;
SDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )";
# echo $SDIR
cd $SDIR;

npm install;
echo "[Unit]
Description=Deply and manage services via HTTP API
Documentation=https://github.com/OscarLundberg/deploy-agent#readme
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=npm run start --prefix $SDIR
Restart=on-failure

[Install]
WantedBy=multi-user.target" >> "/lib/systemd/system/deploy-agent.service";
cd $CDIR;
sudo systemctl start deploy-agent

