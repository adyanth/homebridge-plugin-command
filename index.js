var exec = require('child_process').exec;

var Accessory, Service, Characteristic, UUIDGen;

function commandAccessory(log, config) {
  log("Command Plugin Init");
  this.log = log;
  this.turnOnCommand = config["turn_on"];
  this.turnOffCommand = config["turn_off"];
  this.checkStatusCommand = config["check_status"]
  this.name = config["name"];
  this.currentState = false;
  this.invertStatus = config["invert_status"];
  this.processState();
}

commandAccessory.prototype = {};

commandAccessory.prototype.identify = function (callback) {
  this.log.debug("Identify requested!");
  callback(); // success
};

commandAccessory.prototype.getServices = function () {
  return [this.service];
}

commandAccessory.prototype.getState = function (callback) {
  if (!this.checkStatusCommand) {
    callback(null, this.currentState);
    return;
  }
  exec(this.checkStatusCommand, function (error, stdout, stderr) {
    // Log if needed
  }).on('exit', code => callback(null, this.invertStatus ? code == 0 : code != 0));
}

commandAccessory.prototype.setState = function (value, callback) {
  exec(value ? this.turnOnCommand : this.turnOffCommand, function (error, stdout, stderr) {
    // Log if needed
  }).on('exit', function(code) {
    // Set state depending on whether the command exited successfully or not.
    this.currentState = value ^ (code != 0);
    this.getState(callback);
  });
}

commandAccessory.prototype.processState = function () {
  this.service = new Service.Switch(this.name);
  this.service.getCharacteristic(Characteristic.On)
    .on('get', this.getState)
    .on('set', this.setState);
};

module.exports = function (api) {
  Accessory = api.platformAccessory;
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  UUIDGen = api.hap.uuid;
  api.registerAccessory("homebridge-plugin-command", "commandAccessory", commandAccessory);
}
