import { getWebUsb } from 'usb'

// avoid `ReferenceError: navigator is not defined`
global.navigator = {} as null

export const webusb = getWebUsb()
