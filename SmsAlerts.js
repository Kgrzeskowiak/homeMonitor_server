module.exports = class SmsAlert {
  constructor(axios, key, moment) {
    this.axios = axios;
    this.key = key;
    this.moment = moment;
    this.alarmFrom = this.moment("23:00:00", "HH:mm");
    this.alarmTo = this.moment("07:00:00", "HH:mm");
    this.ticks = 0;
    this.dayAlarmTimeout = 0.2
    this.nightAlarmTimeout = 3
    this.recievers = ''
    this.messageSent = false
  }
  initialize() {}
  updateConfig() {}
  getConfig() {}
  gateStatusUpdate(status) {
    if (status === "open") {
        this.ticks++;  
      }
    if (status === "close") {
        this.ticks = 0;
        if (this.messageSent === true)
        {
            var message = 'Brama została zamknięta' + this.moment().format('dddd HH:mm')
            this.sendSms(message)
            console.log("Wysłany SMS powrotny")
            this.messageSent = false
        }
    }
    if (this.moment().isBetween(this.alarmFrom, this.alarmTo))
    {
        this.alarm(this.nightAlarmTimeout)
    }
    else
    {
        this.alarm(this.dayAlarmTimeout)
    }
  }
  alarm(timeout){
    if (this.ticks >= timeout * 12 && this.messageSent === false) {
            var message = 'Brama garażowa otwarta powyżej ' + timeout + ' minut. Wiadomość wygenerowana :' + this.moment().format('DD-MM HH:mm')
            this.sendSms(message)
            console.log("Wysłany SMS")
    
      }
  }
  sendSms(message) {
    this.messageSent = true; 
    this.axios
      .post("https://api.smsapi.pl/sms.do", {
        access_token: this.key,
        to: this.recievers,
        message: message,
        encoding : 'utf-8',
        test: 0
      })
      .then(function(response) {
        console.log("Status wysyłki", response.status);
      })
      .catch(function(error) {
        console.log("Błąd wysyłki", error);
      });
  }
};
