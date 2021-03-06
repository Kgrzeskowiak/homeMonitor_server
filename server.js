const express = require("express");
const bodyParser = require("body-parser");
const database = require("./dbHandler.js");
var moment = require("moment");
const axios = require("axios");
var mosca = require("mosca");
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var cors = require("cors");
const port = 3000;
const SmsAlert = require("./SmsAlerts.js");
const smsKey = require("./smsToken.js");
const dbConnection = new database();
var mqttClientList = {};
var smsAlert = createSmsAlertClass();
var config = "";

function createSmsAlertClass() {
  var fs = require("fs");
  let rawdata = fs.readFileSync("config.json");
  config = JSON.parse(rawdata);
  return new SmsAlert(axios, smsKey.token, moment, config);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.options("*", cors());

app.get("/temperature", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, Content-Length, X-Requested-With, Content-Type, Accept, Authorization, name"
  );
  var result = dbConnection.getTemperature(
    req.query["nodeName"],
    req.query["timeRange"]
  );
  res.json(result);
});
app.post("/temperature", function(req, res) {
  if (!req.body.id) {
    res.status(400).send("Failure");
    return;
  }
  dbConnection.addNewMeasurment(
    req.body.id,
    req.body.temp,
    req.body.humidity,
    req.body.location,
    req.body.date
  );
  res.send();
});
app.get("/locationTemperature", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, Content-Length, X-Requested-With, Content-Type, Accept, Authorization, name"
  );
  var result = dbConnection.getLocationTemperature(req.query["location"]);
  res.json(result);
});
app.get("/lastReadings", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, Content-Length, X-Requested-With, Content-Type, Accept, Authorization, name"
  );
  var result = dbConnection.getLastReadings();
  res.json(result);
});
app.post("/register", function(req, res) {
  var name = req.param("name");
  var sensorType = req.param("sensorType");
  var gpio = req.param("gpio");
  devicesList.push({ name: name, sensorType: sensorType, gpio: gpio });
  res.send("Device registered");
});
app.get("/deviceList", function(req, res) {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Origin", "*");
  res.json(mqttClientList);
});
app.get("/alarmConfig", function(req, res) {
  var fs = require("fs");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Origin", "*");
  let rawdata = fs.readFileSync("config.json");
  let config = JSON.parse(rawdata);
  res.json(config);
});
{
  app.post("/alarmConfig", function(req, res) {
    var newConfig = req.body
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Origin", "*");
    var fs = require("fs");
    fs.writeFileSync("config.json", JSON.stringify(newConfig), function(err) {
      if (err) {
        res.status(400).send("Failure");
      }
      res.status(200).send("OK");
    });

    smsAlert.updateConfig(newConfig);
  });
}

app.listen(port, () => console.log(`HTTP Server running on ${port}`));

////MQTT SERVER/////

var ascoltatore = {
  type: "redis",
  redis: require("redis"),
  db: 12,
  port: 6379,
  return_buffers: true,
  host: "localhost"
};

var moscaSettings = {
  port: 1883,
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Redis
  }
};

var server = new mosca.Server(moscaSettings);
server.on("ready", setup);

server.on("clientConnected", function(client) {
  console.log(
    client.id + " Connected" + " " + moment().format("MM DD YYYY HH:mm:ss")
  );
  mqttClientList[client.id] = {
    id: client.id,
    type: client.type,
    location: client.location,
    state: "online",
    lastActivity: moment().format("MM DD YYYY, HH:mm:ss")
  };
  // Socket_deviceChangedMessageEmit(client.id)
});
server.on("published", function(packet, client) {
  if (client != null) {
    //console.log('Published', packet.topic, packet.payload);
    if (packet.topic != "register") {
      mqttClientList[client.id].publisher = packet.topic;
      mqttClientList[client.id].state = "online";
    }
    mqttClientList[client.id].lastActivity = moment().format(
      "MM DD YYYY HH:mm:ss"
    );
  }
});
server.on("clientDisconnected", function(client) {
  SocketEmit_deviceDisconnected(mqttClientList[client.id]);
  mqttClientList[client.id].state = "offline";
  console.log(
    client.id,
    "disconnected" + " " + moment().format("MM DD YYYY HH:mm:ss")
  );
});
server.on("subscribed", function(topic, client) {
  // console.log('subscribed', topic, client)
  if (topic != "register") {
    mqttClientList[client.id].topicSubscribed = topic;
    mqttClientList[client.id].state = "online";
  }
  mqttClientList[client.id].lastActivity = moment().format(
    "MM DD YYYY HH:mm:ss"
  );
});

function setup() {
  console.log("Mosca server is running on 1883");
  var mqtt = require("mqtt");
  var options = { clientId: "main_listener" };
  var mqtt_client = mqtt.connect("mqtt://localhost:1883", options);
  mqtt_client.on("connect", function() {
    mqtt_client.subscribe("sensors/temperature", function(err) {});
    mqtt_client.subscribe("register", function(err) {});
    mqtt_client.subscribe("sensors/garage_mainGate", function(err) {});
  });
  mqtt_client.on("message", function(topic, message) {
    var mqttPayload = JSON.parse(message);
    if (topic == "sensors/temperature") {
      axios
        .post("http://192.168.1.9:3000/temperature", {
          id: mqttPayload.id,
          temp: mqttPayload.temperature,
          humidity: mqttPayload.humidity,
          location: mqttPayload.location,
          date: moment().format("YYYY-MM-DD HH:mm")
        })
        .then(function(response) {
          mqttClientList[mqttPayload.id].lastActivity = moment().format(
            "MM DD YYYY HH:mm:ss"
          );
        })
        .catch(function(error) {
          console.log(error);
        });
    }
    if (topic == "register") {
      mqttClientList[mqttPayload.id].type = mqttPayload.type;
      SocketEmit_deviceConnected(mqttClientList[mqttPayload.id]);
    }
    if (topic == "sensors/garage_mainGate") {
      SocketEmit_garageState(mqttPayload.state);
      smsAlert.gateStatusUpdate(mqttPayload.state);
    }
    //client.end()
  });
}

////Socket IO//////

io.on("connection", function(socket) {
  //console.log(socket.id + 'connected');
  socket.on("disconnect", function() {
    //console.log(socket.id + 'disconnected');
  });
});

http.listen(5000, function() {
  console.log("Socket IO is running on 5000");
});

function Socket_deviceChangedMessageEmit(deviceName) {
  var msg = deviceName;
  io.emit("sensor change", msg);
}

function SocketEmit_deviceConnected(client) {
  io.emit("device connected", client);
}
function SocketEmit_deviceDisconnected(client) {
  io.emit("device disconnected", client);
}
function SocketEmit_garageState(state) {
  io.emit("garageState", state);
}
