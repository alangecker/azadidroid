import { isBrowser } from "../utils/platform.js"

export let webusb: USB

if(isBrowser()) {
    webusb = navigator?.usb
} else {
    // avoid `ReferenceError: navigator is not defined`
    global.navigator = {} as null
    webusb = (await import('usb')).getWebUsb()
}