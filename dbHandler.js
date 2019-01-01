
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
addNewMeasurment(id, temp, humidity, date)
{
  const sql = this.db.prepare('INSERT INTO temperatures (sensorId, temperature, humidity, date) VALUES (?,?,?,?)')
  sql.run(id, temp, humidity, date);
}

}
