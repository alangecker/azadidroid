import { ADB_DEVICE, FASTBOOT_DEVICE, ODIN_DEVICE } from './conts.js'

export interface DeviceMatch {
    conf: USBConfiguration;
    intf: USBInterface;
    alternate: USBAlternateInterface;
}
/**
 * Source: https://github.com/GoogleChromeLabs/wadb/blob/main/src/lib/transport/WebUsbTransport.ts
 */
export function findConfigurationMatch(device: USBDevice, filter: USBDeviceFilter): DeviceMatch | null {
    for (const configuration of device.configurations) {
      for (const intf of configuration.interfaces) {
        for (const alternate of intf.alternates) {
          if (filter.classCode === alternate.interfaceClass &&
              filter.subclassCode === alternate.interfaceSubclass &&
              filter.protocolCode === alternate.interfaceProtocol) {
            return {
              conf: configuration,
              intf,
              alternate
            };
          }
        }
      }
    }
    return null;
}

export function isSameDevice(a: USBDevice, b: USBDevice) {
    // this probably only works when not reconnected
    if(a === b) return true
    if(!a || !b) return false

    // otherwiese compare most of the data
    if(a.vendorId !== b.vendorId) return false
    if(a.productId !== b.productId) return false
    if(a.deviceVersionMajor !== b.deviceVersionMajor) return false
    if(a.deviceVersionMinor !== b.deviceVersionMinor) return false
    if(a.deviceVersionSubminor !== b.deviceVersionSubminor) return false
    if(a.productName !== b.productName) return false
    if(a.serialNumber !== b.serialNumber) return false

    // we are quite confident, that it's the same device
    return true
}

export function getEndpoint(endpoints: USBEndpoint[], dir: 'in' | 'out', type = 'bulk'): USBEndpoint {
    for(const ep of endpoints) {
      if (ep.direction === dir && ep.type === type) {
        return ep;
      }
    }
    throw new Error(`Cannot find ${dir} endpoint`);
}


export function findSomeConfigurationMatch(device: USBDevice): DeviceMatch|null {
    let match = findConfigurationMatch(device, ADB_DEVICE)
    if(match) return match
    match = findConfigurationMatch(device, FASTBOOT_DEVICE)
    if(match) return match
    match = findConfigurationMatch(device, ODIN_DEVICE)
    if(match) return match
    return null
}


export enum DeviceMode {
  ADB = 'adb',
  FASTBOOT = 'fastboot',
  ODIN = 'odin'
}

export function getDeviceMode(device: USBDevice): DeviceMode|'unknown' {
    if(!device) return 'unknown'
    if(findConfigurationMatch(device, FASTBOOT_DEVICE)) return DeviceMode.FASTBOOT
    if(findConfigurationMatch(device, ADB_DEVICE)) return DeviceMode.ADB
    if(findConfigurationMatch(device, ODIN_DEVICE)) return DeviceMode.ODIN
    return 'unknown'
}