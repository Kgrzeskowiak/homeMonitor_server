module.exports = class SmsAlert {
  constructor(axios, key, moment, config) {
    this.axios = axios;
    this.key = key;
    this.moment = moment;
    this.nightFrom = this.moment(config.nightFrom, "HH:mm");
    this.nightTo = this.moment(config.nightTo, "HH:mm");
    this.ticks = 0;
    this.dayAlarmTimeout = config.dayAlarmTimeout
    this.nightAlarmTimeout = config.nightAlarmTimeout
    this.recievers = config.recievers.join()
    this.messageSent = false
    this.active = config.alarmActive
  }
  updateConfig() {
    this.nightFrom = this.moment(config.nightFrom, "HH:mm");
    this.nightTo = this.moment(config.nightTo, "HH:mm");
    this.dayAlarmTimeout = config.dayAlarmTimeout
    this.nightAlarmTimeout = config.nightAlarmTimeout 
    this.recievers = config.recievers.join()
    this.active = config.alarmActive
  }
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
    if (this.moment().isBetween(this.nightFrom, this.nightTo))
    {
        this.alarm(this.nightAlarmTimeout)
    }
    else
    {
        this.alarm(this.dayAlarmTimeout)
    }
  }
  alarm(timeout){
    if (this.active === true){
    if (this.ticks >= timeout * 12 && this.messageSent === false) {
            var message = 'Brama garażowa otwarta powyżej ' + timeout + ' minut.' + this.moment().format('DD-MM HH:mm')
            this.sendSms(message)
            console.log("Wysłany SMS", message)
      }
  }
  else {
      console.log("Alarm is set to off")
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
        test: 1
      })
      .then(function(response) {
        console.log("Status wysyłki", response.status);
      })
      .catch(function(error) {
        console.log("Błąd wysyłki", error);
      });
  }
};
