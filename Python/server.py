from flask import Flask, jsonify, Response, render_template, request
from flask_socketio import SocketIO, send, emit
from database_handler import DatabaseHandler
import json
import datetime

app = Flask(__name__)
app.config['SECRET KEY'] = 'secret!'
socketio = SocketIO(app)
clients = []


@app.route('/')
def index():
    result = []
    with open('results.txt', 'r') as fileHandler:
        for line in fileHandler:
            date, temperature, humidity = line.strip().split(';')
            result.append({'date':date, 'temperature':temperature, 'humidity':humidity})
    resp = Response(json.dumps(result), content_type='application/json')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp
@app.route('/endpoint', methods=["POST"])
def endpoint():
    status = request.args.get('status')
    response = Response(status=200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    print(status)
    socketio.emit('any event', status, broadcast=True)
    return response

@socketio.on('message')
def handle_message(message):
    print('recieved message:' + message)
@socketio.on('moevement')
def movement_message():
    print('ruch')

@socketio.on('connect')
def connect():
    print('connected:')
    emit('any event', "xxx")
    clients.append(request.sid)

@socketio.on('my event')
def handle_my_custom_event_recieve(json):
    print('received json: ' + str(json))

def updateTemperature(id,temp,hum,date2):
    db = DatabaseHandler()
    db.updateTemperature(id,temp,hum,date2)

if __name__ == '__main__':
    print("leci")
    date1 = datetime.datetime.now().strftime('%d-%m-%y %H:%M')
    print(date1)
    updateTemperature(10,20,30,date1)
    app.run(debug=True, host='0.0.0.0')
    socketio.run(app, cors_allowed_origins="*")
    print("xxx")
