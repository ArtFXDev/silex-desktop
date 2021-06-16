const WebSocket = require('ws');

const WS_PORT = 8080;
let wss;

// List of dccs connected to the server
const dccClients = [];

function removeClient(clientId) {
  for (let i = dccClients.length - 1; i >= 0; i --) {
    if (dccClients[i] === clientId) {
      dccClients.splice(i, 1);
    }
  }
}

module.exports.startWebSocketServer = function () {
  console.log("Starting WebSocket server on port " + WS_PORT);
  wss = new WebSocket.Server({ port: WS_PORT });

  // On a new connection
  wss.on('connection', function connection(ws, req) {
    const clientId = req.headers['sec-websocket-key'];

    // Add the dcc to the list of clients
    dccClients.push(clientId);

    console.log("New client UUID : " + clientId);

    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      ws.send('Server return : ' + message);
    });

    ws.on('close', function close() {
      removeClient(clientId);
      console.log("Client " + clientId + " close connection");
    });

    ws.send('something');
    // setInterval(() => {ws.send(Math.random()); console.log("send")}, 1000);
  });
};

module.exports.dccClients = dccClients;
