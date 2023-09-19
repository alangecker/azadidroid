import { isBrowser } from "../utils/platform"

export let webusb: USB

if(isBrowser()) {
    webusb = navigator?.usb
} else {
    // avoid `ReferenceError: navigator is not defined`
    global.navigator = {} as null
    import('usb').then(({getWebUsb}) => {
        webusb = getWebUsb()
    })
}