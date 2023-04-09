import { webusb } from './usb.js'
import { ADB_DEVICE, FASTBOOT_DEVICE, ODIN_DEVICE } from './conts.js'
import { isClaimError, isConnectUdevError, isNoDeviceSelectedError } from './errors.js'
import { isSameDevice, getEndpoint, getDeviceMode, DeviceMode, findSomeConfigurationMatch } from './helpers.js'
import { AdbWrapper } from './adb/AdbWrapper.js'
import sleep from '../utils/sleep.js'
import { OdinDevice } from 'heimdall.js/src/OdinDevice.js'
import { isBrowser, isNode } from '../utils/platform.js'
import { logger } from '../utils/logger.js'
/// <reference path="./android-fastboot.d.ts" />
import * as fastboot from "android-fastboot";

export class StateChangeEvent extends Event {
    constructor() {  super('stateChanged') }
}
export class ConnectedEvent extends Event {
    constructor() {  super('connected') }
}
export class DisconnectedEvent extends Event {
    constructor() {  super('disconnected') }
}
export class BackgroundErrorEvent extends Event {
    constructor() {  super('backgroundError') }
}
/**
 * ADB authentication took longer than 2 seconds.
 * this is most likely because the user got asked,
 * whether to accept the connection
 */
export class AuthenticationSlowEvent extends Event {
    constructor() {  super('authSlow') }
}
export class DeviceMissingEvent extends BackgroundErrorEvent {}
export class AccessDeniedEvent extends BackgroundErrorEvent {}
export class ClaimFailedEvent extends BackgroundErrorEvent {}
export class UnexpectedBackgroundErrorEvent extends BackgroundErrorEvent {
    err: Error
    constructor(err: Error) {
        super()
        this.err = err
    }
}
/**
 * during switches in the phone state like going
 * from running android with ADB to the bootloader
 * the phone gets detected as different USB devices.
 * 
 * this class tries to abstract all of this, so that 
 * further code doesn't need to handle this and can
 * simply just pass around a single class instance
 */
export default class USBPhone implements EventTarget {
    private events = new EventTarget()
    addEventListener(type: string, cb: EventListenerOrEventListenerObject) { return this.events.addEventListener(type, cb) }
    removeEventListener(type: string, cb: EventListenerOrEventListenerObject) { return this.events.removeEventListener(type, cb) }
    dispatchEvent(ev: Event) { return this.events.dispatchEvent(ev) }

    static RECONNECT_INTERVAL = 300

    /**
     * last connected USBDevice instance
     */
    private device: USBDevice

    /**
     * all USBDevice instance we have ever been connected
     */
    private knownAssosicatedDevices: USBDevice[] = []
    

    private pairedModes: DeviceMode[] = []
    private isConnected = false
    private reconnectInterval: NodeJS.Timer
    private newPairingTimeout: NodeJS.Timeout
    private endpointIn: USBEndpoint
    private endpointOut: USBEndpoint
    private isClosed = false

    get currentDevice(): USBDevice|null { return this.isConnected ? this.device : null }
    get deviceMode() { 
        if(!this.isConnected) return 'unknown'
        return getDeviceMode(this.device)
    }

    isUnlocked: boolean|null = null

    constructor() {
        webusb.addEventListener('disconnect', this._onAnyDeviceDisconnect)
    }

    /**
     * Tries to connect to the device.
     */
     async requestDevice() {
        const device = await webusb.requestDevice({filters: this._possibleModesFilter() }) 
        await this._useDevice(device)
    }

    private isReconnecting = false
    async reconnect() {
        if(this.isReconnecting) {
            throw new Error('trying to start to reconnect again, but reconnect() is already running')
        }
        this.isReconnecting = true

        if(isBrowser() && this.knownAssosicatedDevices.length) {
            let waited = 0
            while((waited++) < 20) {
                try {
                    const pairedDevices = await webusb.getDevices()
                    for(let device of pairedDevices) {
                        for(let knownAssosicatedDevice of this.knownAssosicatedDevices) {
                            if(isSameDevice(device, knownAssosicatedDevice)) {
                                // found a known one!
                                await this._useDevice(device)
                                this.isReconnecting = false
                                return
                            }
                        }
                    }
                } catch(err) {
                    logger.error(err)
                }
                await sleep(USBPhone.RECONNECT_INTERVAL)
            }
        }

        while(!this.isClosed) {
            try {
                const device = await webusb.requestDevice({filters: this._possibleModesFilter() })    
                await this._useDevice(device)
                this.isReconnecting = false
                return
            } catch(err) {
                // throw all errors and stop except for "no devices found" with node.js
                if(!isNoDeviceSelectedError(err) || isBrowser()) {
                    this._handleBackgroundConnectError(err)
                    this.isReconnecting = false
                    return
                }
            }
            await sleep(USBPhone.RECONNECT_INTERVAL)
        }
    }

    private _onAnyDeviceDisconnect = (ev: USBConnectionEvent) =>  {
        if(!isSameDevice(ev.device, this.device)) return // ignore
        this._onDisconnect()
    }

    async close() {
        this.isClosed = true
        webusb.removeEventListener('disconnect', this._onAnyDeviceDisconnect)
        
        if(this.device) await this.device.close()
        this.device = null
        this.knownAssosicatedDevices = []
    }


    /**
     * when disconnected it tries to reconnect
     * either to a known and already paired device or
     * after a timeout prompts the user for a new 
     */
    private _onDisconnect() {
        logger.debug(`device(mode=${this.deviceMode}) disconnected`)
        this.isConnected = false
        this.dispatchEvent(new DisconnectedEvent())

        if(!this.isReconnecting) this.reconnect()
    }


    private _possibleModesFilter(): USBDeviceFilter[] {
        const filters: USBDeviceFilter[] = []
        if(!this.pairedModes.includes(DeviceMode.FASTBOOT)) {
            filters.push(ODIN_DEVICE)
        }
        if(!this.pairedModes.includes(DeviceMode.ODIN)) {
            filters.push(FASTBOOT_DEVICE)
        }
        filters.push(ADB_DEVICE)

        return filters
    }

    private _isKnownDevice(device: USBDevice) {
        for(let knownDevice of this.knownAssosicatedDevices) {
            if(isSameDevice(knownDevice, this.device)) {
                return true
            }
        }
        return false
    }

    /**
     * handles a freshly attached device
     */
    private async _useDevice(device: USBDevice) {
        logger.debug(`_useDevice(${device.vendorId}:${device.productId})`)

        const isReconnect = !!this.knownAssosicatedDevices.length
        
        this.device = device
        if(!this._isKnownDevice(device)) {
            this.knownAssosicatedDevices.push(device)
            this.pairedModes.push(getDeviceMode(device) as DeviceMode)
        }
        
        await this._initialize()
        
        if(isReconnect) {
            if(!isSameDevice(device, this.device)) {
                this.dispatchEvent(new StateChangeEvent())
            }
            this.dispatchEvent(new Event('reconnected'))
        } else {
            this.dispatchEvent(new ConnectedEvent())
        }
    }
    private async _initialize() {
        logger.debug(`_initialize()`)
        const match = findSomeConfigurationMatch(this.device)
        await this.device.open()
        await this.device.selectConfiguration(match.conf.configurationValue);
        await this.device.claimInterface(match.intf.interfaceNumber);
        this.endpointIn = getEndpoint(match.alternate.endpoints, 'in');
        this.endpointOut = getEndpoint(match.alternate.endpoints, 'out');    
        this.isConnected = true
    }
    
    private _handleBackgroundConnectError(err: Error) {
        logger.debug(`_handleBackgroundConnectError()`, err)
        console.error(err)
        if(isNoDeviceSelectedError(err)) {
            this.dispatchEvent(new DeviceMissingEvent())
        } else if(isConnectUdevError(err)) {
            this.dispatchEvent(new AccessDeniedEvent())
        } else if(isClaimError(err))  {
            this.dispatchEvent(new ClaimFailedEvent())
        } else {
            this.dispatchEvent(new UnexpectedBackgroundErrorEvent(err))
        }
    }

    private _adb: AdbWrapper
    async getAdb(initialize = true): Promise<AdbWrapper> {
        if(this._adb) return this._adb
        this._adb = await AdbWrapper.connectToUSBDevice(this.device, this.endpointIn, this.endpointOut, initialize, () => {
            this.dispatchEvent(new AuthenticationSlowEvent())
        })

        this.events.addEventListener('disconnected', () => {
            this._adb = null
        }, { once: true })

        return this._adb
    }
    async getOdin() {
        const device = new OdinDevice(this.device as any)
        device.setEndpoints(this.endpointIn, this.endpointOut)
        await device.initialise()
        return device
    }
    async getFastboot() {
        fastboot.setDebugLevel(3)
        const device = new fastboot.FastbootDevice;
        device._registeredUsbListeners = true
        device.device = this.device
        device.epIn = this.endpointIn.endpointNumber
        device.epOut = this.endpointOut.endpointNumber

        this.events.addEventListener('reconnected', () => {
            if(this.deviceMode !== DeviceMode.FASTBOOT) return
            device.device = this.device

            const d = device as any
            if (d._connectResolve !== null) {
                d._connectResolve(undefined);
                d._connectResolve = null;
                d._connectReject = null;
            }
        })
        return device
    }
    async waitFor(target: 'adb'|'fastboot'|'odin') {
        while(!this.isConnected || this.deviceMode !== target) {
            await sleep(100)
        }
        if(target === 'adb') {
        } else if(target === 'odin') {
            // await this.getOdin()
        }
    }
}


