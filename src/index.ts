import WebSocket from 'ws';

const ws = new WebSocket('wss://ftx.com/ws/');

ws.on('open', function open() {
  ws.send(JSON.stringify({'op': 'subscribe', 'channel': 'ticker', 'market': 'SOL-PERP'}));
});

ws.on('message', function incoming(message) {
  console.log(JSON.parse(message.toString()));
});
