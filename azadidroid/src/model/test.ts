
// import { webusb } from './usb'
// import { ADB_DEVICE, FASTBOOT_DEVICE, ODIN_DEVICE } from './conts'
// import { isSameDevice } from './helpers'
// import USBPhone from './USBPhone'
// // avoid `ReferenceError: navigator is not defined`
// global.navigator = null
// void async function main() {
//     const phone = new USBPhone()
//     phone.addEventListener('backgroundError', console.log)
//     phone.addEventListener('disconnected', console.log)
//     phone.addEventListener('connected', console.log)
//     phone.addEventListener('reconnected', console.log)
//     phone.addEventListener('stateChanged', console.log)
    
//     await phone.requestDevice()
//     console.log(phone)
// }()
