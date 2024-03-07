import Main from "../src/main";

async initServer() {
    (this as Main)._global.stats.lastUpdates = { "initServer": Date.now() };
    (this as Main)._server._handle.web.create().then(() => {
      (this as Main)._server._handle.web.on('connection', function done(ws: any) {
        this._global.stats.lastUpdates = { "ws": Date.now() };
        if (!this._clients[ws.id]) {
          this._clients.addClient(this._global.stats.clientsCounter, { "ip": ws.ip }).then(() => {
            globalEventEmitter.emit('clientConnected', ws);
            ws.id = this._clients.id;
            ws.ip = ws.socket.remoteAddress;
          }).catch(() => {
            console.error(`Could not create Client with ID: ${ws.id}`)
          });
        }
        if (this._clients[ws.id]) this._clients.updateClientStats(ws.id).catch(() => {
          console.error(`Updating Client with ID: ${ws.id} failed`)
        });
        else console.error(`No Client with ID: ${ws.id} exists`);
        console.log(this._global.stats);

        ws.on('error', console.error);
        ws.on('close', (code: any) => {
          console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this._global.stats.clientsCounter + ")");
          this._server._handle.web.destroyClient(ws.ip);
          ws.terminate;
          if (this._global.stats.clientsCounter == 0) {
            clearInterval(this.interval_sendinfo);
            this.interval_sendinfo = undefined;
          }
        });

        ws.on('message', function message(data: any, isBinary: any) {
          const decodedJsonObject = Buffer.from(data, 'base64').toString();
          console.log("decodedJsonObject", decodedJsonObject);
          const obj = JSON.parse(decodedJsonObject);
          if (typeof obj.type !== "undefined") {
            switch (obj.type) {
              case 'greeting':
                if (typeof obj.admin !== "undefined" && obj.admin == 1) this.isAdmin. = true;
                if (!main._clients[ws.id]) {
                  console.error(`No Client with ID: ${ws.id} known`);
                }
                this._clients.client.setCustomClientConfig(ws.id, ws.ip, { "admin": admin });
                console.log(ws.id, main._clients[ws.id]);
                console.log('from ' + ws.ip + " admin " + ws.admin + " count(" + this._global.stats.clientsCounter + ")");
                this._server._handle.web.forEach(function each(ws_client: any) {
                  if (ws_client.readyState === ws.OPEN) {
                    this._clients[ws.id].getClientLatency();
                    console.log('to ' + ws_client.ip + " admin " + ws_client.admin);
                    if (ws_client.admin === true || ws.ip == "192.168.228.7") { const dummy = true; }
                  }
                });
                break;
                
            }
          }
        });
        if (typeof this.interval_sendinfo === 'undefined') {
          if (!this._global.stats.getPid()) {
            console.log("wrong here");
            this._handle.web.close();
            clearInterval(this.interval_sendinfo);
            this.interval_sendinfo = undefined;
          } else {
            this.interval_sendinfo = setInterval(() => {
              this._stats.updateGlobalStats();
              this._clients.forEach((client: { readyState: any; OPEN: any; now: number; send: (arg0: string) => void; connectedSince: any; }) => {
                if (client.readyState === client.OPEN) {
                  const timeDiff = Date.now() - client.now;
                  client.send(JSON.stringify({
                    latencyUser: timeDiff,
                    latencyGoogle: this._stats.latencyGoogle,
                    connectedSince: client.connectedSince,
                  }));
                }
              });
            }, 1000);
          }
        }
      }.bind(this));
    });

    globalEventEmitter.on('clientDisconnected', (ip: string) => {
      console.log("Client Disconnected: ", ip);
    });
    globalEventEmitter.on('statsUpdated', (stats: GlobalValues) => {
      console.log("Stats Updated:", stats);
    });

  }

