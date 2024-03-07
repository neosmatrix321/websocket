import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080, host: "192.168.228.7" }, () => {   console.log('Http server listening on 8080') });
console.log(wss);
wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});