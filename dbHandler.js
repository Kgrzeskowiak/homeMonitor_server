
module.exports = class dbLite {
  constructor()
  {
   this.db = require('better-sqlite3')('homemonitorDB.db', {readonly : false});
  }

getLocationTemperature(location)
{
  const sql = this.db.prepare('SELECT * FROM temperatures WHERE measurmentDate >= datetime("now", "-30 minutes", "localtime") and location = $location');
  var dataJson = sql.all(
      {
        location : location
      }
  )
  return dataJson
}
getLastReadings()
{
  const sql = this.db.prepare('SELECT * FROM temperatures WHERE measurmentDate >= datetime("now", "-30 minutes", "localtime") group by location');
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
addNewMeasurment(id, temp, humidity, location, date)
{
  const sql = this.db.prepare('INSERT INTO temperatures (sensorId, temperature, humidity, location, measurmentDate) VALUES (?,?,?,?,?)')
  sql.run(id, temp, humidity, location, date);
}

}
