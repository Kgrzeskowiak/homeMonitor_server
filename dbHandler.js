
module.exports = class dbLite {
  constructor()
  {
   this.db = require('better-sqlite3')('homemonitorDB.db', {readonly : false});
  }

getTemperatures()
{
  const sql = this.db.prepare('SELECT * FROM temperatures');
  var dataJson = sql.all()
  return dataJson
}
getTemperature(nodeName, timeRange)
{
  timeRange = timeRange + ' days'
  const sql = this.db.prepare('SELECT * FROM temperatures WHERE measurmentDate > date($param, $timeRange) and sensorId = $sensorName')

  var dataJson = sql.all({
    param : 'now',
    timeRange : timeRange,
    sensorName : nodeName
})
  return dataJson
}
addNewMeasurment(id, temp, humidity, date)
{
  const sql = this.db.prepare('INSERT INTO temperatures (sensorId, temperature, humidity, measurmentDate) VALUES (?,?,?,?)')
  sql.run(id, temp, humidity, date);
}

}
