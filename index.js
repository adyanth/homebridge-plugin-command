var exec = require('child_process').exec;

module.exports = function (api) {
  api.registerAccessory("homebridge-plugin-command", "commandAccessory", CommandAccessoryPlugin);
}

class CommandAccessoryPlugin {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.currentState = false;

    this.log.debug('Command Accessory Plugin Loaded');

    // your accessory must have an AccessoryInformation service
    this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "adyanth")
      .setCharacteristic(this.api.hap.Characteristic.Model, config["name"]);

    // create a new "Switch" service
    this.switchService = new this.api.hap.Service.Switch(this.name);

    // link methods used when getting or setting the state of the service 
    this.switchService.getCharacteristic(this.api.hap.Characteristic.On)
      .onGet(this.getStateHandler.bind(this))   // bind to getStateHandler method below
      .onSet(this.setStateHandler.bind(this));  // bind to setStateHandler method below
  }

  getServices() {
    return [
      this.informationService,
      this.switchService,
    ];
  }

  async getStateHandler() {
    this.log.info(`Getting ${this.config.name} switch state`);

    if (!this.config.check_status) {
      return this.currentState;
    }

    code = await exec(this.check_status, function (error, stdout, stderr) {
      // Log if needed
    })
    
    return this.config.invert_status ? code == 0 : code != 0;
  }

  async setStateHandler(value) {
    this.log.info(`Setting ${this.config.name} switch state to: `, value);
    
    code = await exec(value ? this.config.turn_on : this.config.turn_off, function (error, stdout, stderr) {
      // Log if needed
    })

    // Set state depending on whether the command exited successfully or not.
    this.currentState = value ^ (code != 0);
    return this.currentState;
  }
}
