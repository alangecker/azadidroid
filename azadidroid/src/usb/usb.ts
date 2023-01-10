import { getWebUsb } from 'usb'

// avoid `ReferenceError: navigator is not defined`
global.navigator = null

export const webusb = getWebUsb()
