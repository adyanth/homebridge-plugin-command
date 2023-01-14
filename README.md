# homebridge-plugin-command

This Homebridge plugin enables you to create virtual switches that can run any custom command when it is turned on or off.

## How to use

In the Accessories section of Homebridge, use the below config as a template.
By default, `check_status` assumes turned on if the exit code of the command is 0. Set `invert_status` to true to flip it.
`check_status` command is optional, and if not provided, it just alternates as you turn it on and off.

```
{
  "accessory": "commandAccessory",
  "name": "File switch",
  "turn_on": "touch /tmp/testFile",
  "turn_off": "rm /tmp/testFile",
  "check_status": "ls /tmp/testFile",
  "invert_status": false,
}
```
