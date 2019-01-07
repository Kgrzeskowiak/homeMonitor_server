const express = require('express')
const app = express()
const port = 3000
const database = require('./dbHandler.js');
const dbConnection = new database
var mosca = require('mosca')
var devicesList = [];
var mqttClientList = [];

var searchF = function searchValue(value)
{
  return function search(element)
  {
    if (element == value)
    return element
  }
}


app.get('/temperature', function (req, res) {
    var result = dbConnection.getTemperatures()
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(result)
  })
app.post('/temperature', function (req, res) {
    var id = req.param('id');
    var temp = req.param('temp');
    var humidity = req.param('humidity');
    var date = req.param('date');
    dbConnection.addNewMeasurment(id,temp,humidity,date)
    res.send("200 OK");
  })
app.post('/register', function (req, res) {
  var name = req.param('name');
  var sensorType = req.param('sensorType');
  var gpio = req.param('gpio');
  devicesList.push({name : name, sensorType : sensorType, gpio : gpio})
  res.send("Device registered")
})
app.get('/register', function (req,res) {
  var deviceListJson = JSON.parse(devicesList)
  res.json(deviceListJson)
})

app.listen(port, () => console.log(`Server running on ${port}!`))

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
  mqttClientList.push({client : client.id})
});

server.on('published', function(packet, client) {
  if (client != null) {
  console.log('Published', packet.topic, packet.payload);
  var indexNumber = mqttClientList.findIndex(searchF(client.id))
  mqttClientList[indexNumber].publisher = packet.topic
  }
});
server.on('subscribed', function(topic, client) {
  // console.log('subscribed', topic, client)
  var indexNumber = mqttClientList.findIndex(searchF(client.id))
  mqttClientList[indexNumber].topicSubscribed = topic
  console.log(mqttClientList)
})



function setup() {
  console.log('Mosca server is up and running')
  var mqtt = require('mqtt')
  var options = { clientId: 'listener' }
  var mqtt_client = mqtt.connect('mqtt://localhost:1883', options)

  mqtt_client.on('connect', function () {
  mqtt_client.subscribe('sensors/temperature', function (err) {
    if (!err) {
      mqtt_client.publish('presence', 'Hello mqtt')
    }
  })
})
mqtt_client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
  //client.end()
})
}

