export const ADB_DEVICE: USBDeviceFilter = {classCode: 255, subclassCode: 66, protocolCode: 1};
export const FASTBOOT_DEVICE: USBDeviceFilter = {classCode: 255, subclassCode: 66, protocolCode: 3};

// TODO: works for me, but is this a suitable way to filter all devices in download mode?
// heimdall and others usually use prouctIds for filtering
export const ODIN_DEVICE: USBDeviceFilter  = {vendorId: 0x04E8, classCode: 0xa, subclassCode: 0, protocolCode: 0};
