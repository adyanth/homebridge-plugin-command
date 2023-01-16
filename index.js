const { execSync } = require('child_process');

module.exports = function (api) {
  api.registerAccessory("Command Accessory", CommandAccessoryPlugin);
}

function durationSeconds(timeExpr) {
  if (!isNaN(timeExpr)) {
    return parseInt(timeExpr, 10);
  }
  var units = { 'd': 86400, 'h': 3600, 'm': 60, 's': 1 };
  var regex = /(\d+)([dhms])/g;

  let seconds = 0;
  var match;
  while ((match = regex.exec(timeExpr))) {
    seconds += parseInt(match[1], 10) * units[match[2]];
  }

  return seconds;
}

class CommandAccessoryPlugin {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.currentState = false;

    // your accessory must have an AccessoryInformation service
    this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "adyanth")
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber, "#007")
      .setCharacteristic(this.api.hap.Characteristic.Model, config["name"]);

    // create a new "Switch" service
    this.switchService = new this.api.hap.Service.Switch(this.name);

    // link methods used when getting or setting the state of the service 
    this.switchService.getCharacteristic(this.api.hap.Characteristic.On)
      .onGet(this.getState.bind(this))   // bind to getStateHandler method below
      .onSet(this.setState.bind(this));  // bind to setStateHandler method below

    if (this.config.check_status && this.config.poll_check) {
      let secs = durationSeconds(this.config.poll_check);
      if (isNaN(secs) || secs < 1) {
        this.log.error("Too frequent or incorrect poll check time, polling disabled.");
        return;
      }
      this.log.info(`Setting poll interval to ${secs}s`);
      this.interval = setInterval(async () => {
        this.log.debug("Polling status");
        let oldState = this.currentState;
        if (await this.getState(secs * 1000) != oldState) {
          this.log.debug("Updating state")
          this.switchService.getCharacteristic(this.api.hap.Characteristic.On)
            .updateValue(this.currentState);
        }
        this.log.debug(`Polling done`);
      }, secs * 1000);
    }

    this.log.info(`Command Accessory Plugin Loaded`);
  }

  getServices() {
    return [
      this.informationService,
      this.switchService,
    ];
  }

  async getState(timeout = undefined) {
    this.log.debug(`Getting switch state`);

    if (!this.config.check_status) {
      this.log.debug(`No check_status, returning static state: ${this.currentState}`)
      return this.currentState;
    }

    this.log.debug(`Running: ${this.config.check_status}`);

    try {
      execSync(this.config.check_status, { timeout: timeout });
      this.currentState = !this.config.invert_status;
    } catch (error) {
      this.currentState = false;
    }

    this.log.debug(`Returning: ${this.currentState}`);
    return this.currentState;
  }

  async setState(value) {
    this.log.debug(`Setting switch state to: `, value);

    let cmd = value ? this.config.turn_on : this.config.turn_off;
    let exitCode = 1;
    this.log.debug(`Running: ${cmd}`);
    try {
      execSync(cmd);
      exitCode = 0;
    } catch (error) {
      exitCode = 1;
    }

    // Set state depending on whether the command exited successfully or not.
    this.currentState = value ^ (exitCode != 0);
    this.log.debug(`Returning: ${this.currentState}}`);
    return this.currentState;
  }
}
