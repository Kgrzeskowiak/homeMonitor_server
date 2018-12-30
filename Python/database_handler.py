import sqlite3


class DatabaseHandler:
    def __init__(self):
        self.connection = sqlite3.connect('/home/pi/sqliteFolder/homemonitorDB.db')

    def createSchema(self):
        c = self.connection.cursor()
        c.execute('''CREATE TABLE temperatures
             (sensorId text, temperature numeric, humidity numeric, date text)''')

    def updateTemperature(self,sensorId,temperature,humidity,date):
        # sql = ''' INSERT INTO temperatures(sensorId, temperature, humidity, date) VALUES(?,?,?,?) '''
        c = self.connection.cursor()

        c.execute("INSERT INTO temperatures VALUES ({},{},{},{})".format(sensorId,temperature,humidity,date)
        self.connection.commit()
        self.connection.close()
        # ("INSERT INTO temperatures VALUES ('1,25.1,34.0,2018-25-10')")


