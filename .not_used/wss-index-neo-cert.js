import { createServer } from 'https';
import { readFileSync } from 'fs';
import { WebSocketServer } from 'ws';

const server = createServer({
  cert: readFileSync('/etc/letsencrypt/live/neo.dnsfor.me/cert.pem'),
  key: readFileSync('/etc/letsencrypt/live/neo.dnsfor.me/privkey.pem')
});
const wss = new WebSocketServer({ server });
console.log(wss);
wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});

server.listen(8080, () => {   console.log('Http server listening on 8080') });