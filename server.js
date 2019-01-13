const express = require('express')
const bodyParser = require('body-parser');
const database = require('./dbHandler.js');
const axios = require('axios')
var mosca = require('mosca')
var moment = require('moment');
const app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
const port = 3000
const dbConnection = new database
var mqttClientList = {};
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.get('/temperature', function (req, res) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
    var result = dbConnection.getTemperatures()
    res.json(result)
  })
app.post('/temperature', function (req, res) {
    dbConnection.addNewMeasurment(req.body.id,req.body.temp,req.body.humidity,req.body.date)
    res.send("200 OK");
  })
app.post('/register', function (req, res) {
  var name = req.param('name');
  var sensorType = req.param('sensorType');
  var gpio = req.param('gpio');
  devicesList.push({name : name, sensorType : sensorType, gpio : gpio})
  res.send("Device registered")
})
app.get('/deviceList', function (req,res) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Origin", "*");
  res.json(mqttClientList)
})

app.listen(port, () => console.log(`HTTP Server running on ${port}!`))

////MQTT SERVER/////

var ascoltatore = {
  type: 'redis',
  redis: require('redis'),
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
server.on('ready', setup);

server.on('clientConnected', function(client) {
  console.log('client connected', client.id);	
  mqttClientList[client.id] = { id : client.id }
  mqttClientList[client.id].lastActivity = moment().format('MM DD YYYY, HH:mm:ss')

});

server.on('published', function(packet, client) {
  if (client != null) {
  //console.log('Published', packet.topic, packet.payload);
  mqttClientList[client.id].publisher = packet.topic
  mqttClientList[client.id].lastActivity = moment().format('MM DD YYYY, HH:mm:ss')
  }
});
server.on('clientDisconnected', function(client)
{
  delete mqttClientList[client.id]
  console.log(client.id, "disconnected")
})
server.on('subscribed', function(topic, client) {
  // console.log('subscribed', topic, client)
  mqttClientList[client.id].topicSubscribed = topic
  mqttClientList[client.id].lastActivity = moment().format('MM DD YYYY, HH:mm:ss')
})

function setup() {
  console.log('Mosca server is up and running')
  var mqtt = require('mqtt')
  var options = { clientId: 'main_listener' }
  var mqtt_client = mqtt.connect('mqtt://localhost:1883', options)

  mqtt_client.on('connect', function () {
  mqtt_client.subscribe('sensors/temperature', function (err) {
    // if (!err) {
    //   mqtt_client.publish('presence', 'Hello mqtt')
    // }
  })
})
mqtt_client.on('message', function (topic, message) {
  if (topic = 'sensors/temperature')
  {
    var mqttPayload = JSON.parse(message);
 
    axios.post('http://192.168.1.9:3000/temperature', {
    id: mqttPayload.id,
    temp: mqttPayload.temperature,
    humidity: mqttPayload.humidity,
    date: mqttPayload.date
    })
    .then(function (response) {
      mqttClientList[mqttPayload.id].lastActivity = moment().format('MM DD YYYY, HH:mm:ss')
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  //client.end()
})
}

////Socket IO//////

io.on('connection', function(socket){
  console.log('a user connected');
  msgSend()
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(5000, function(){
  console.log('listening on *:5000');
});
function msgSend(){
  var msg = "Sensor wjechal"
  io.emit('sensor registered', msg)
  console.log("sygnal poszedl")
}


