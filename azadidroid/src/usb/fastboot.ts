/// <reference path="./android-fastboot.d.ts" />
import * as fastboot from "android-fastboot";

export class FastbootDeviceModded extends fastboot.FastbootDevice {
    async connectDevice(device: USBDevice) {
        this.device = device;
        this._registeredUsbListeners = true;
        // await this._validateAndConnectDevice();
    }
}