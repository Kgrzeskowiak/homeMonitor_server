const express = require('express')
const app = express()
const port = 3000
const database = require('./dbHandler.js');
const dbConnection = new database
var devicesList = [];


app.get('/temperature', function (req, res) {
    var result = dbConnection.getTemperatures()
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