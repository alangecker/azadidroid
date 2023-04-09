import { Adb, AdbPacketDispatcher } from '@yume-chan/adb';
import { AdbWebUsbBackendStream } from './AdbWebUsbBackendStream.js'
import sleep from '../../utils/sleep.js';
import AdbHybridCredentialStore from './AdbHybridCredentialStore.js';
import { adbSideload } from './sideload.js';
import { logger } from '../../utils/logger.js';
import { TwrpHelper } from './twrp.js';

const CredentialStore = new AdbHybridCredentialStore();

// without this, adb would script would just crash without any error message
// could not find any other way to catch this error
process.on('unhandledRejection', (error, p) => {
    
    // console.log('=== UNHANDLED REJECTION ===');
    // console.dir((error as any)?.stack);
});

export class AdbWrapper {
    constructor(
        readonly adb: Adb
    ) {}
    static async connectToUSBDevice(usbDevice: USBDevice, inEndpoint: USBEndpoint, outEndpoint: USBEndpoint, loadProps = true, onAuthSlow?: Function): Promise<AdbWrapper> {
        const streams = new AdbWebUsbBackendStream(usbDevice, inEndpoint, outEndpoint);
        let timeout: NodeJS.Timeout|number
        let authSlowTimer: NodeJS.Timeout|number
        return new Promise( async (resolve, reject) => {
            timeout = setTimeout(() => {
                reject(new Error('authentication timeout'))
            }, 20000)
            
            if(onAuthSlow) {
                authSlowTimer = setTimeout(onAuthSlow, 2000)
            }

            const device = await Adb.authenticate(
                streams,
                CredentialStore,
                undefined
            );
            clearTimeout(timeout)
            clearTimeout(authSlowTimer)

            const d = new AdbWrapper(device)
            if(loadProps) {
                await d.loadProps()
            }
            resolve(d)
        })
    }
    
    isRecovery: boolean = false
    productDevice: string = ''
    async loadProps() {
        this.isRecovery = parseInt(await this.getProp('ro.boot.boot_recovery')) === 1
        this.productDevice = await this.getProp('ro.product.device')
        // samsung.hardware
        // ro.product.model
        // ro.product.device
    }

    async getProp(key: string) {
        const value = await this.adb.getProp(key)
        logger.debug(`Adb.getProp(${key})=${value}`)
        return value
    }

    /**
     * SM_G870F, Pixel_3a, ...
     */
    get model() {
        return this.adb.model
    }
    /**
     * sargo, klteactivexx, ...
     */
    get product() {
        return this.adb.product
    }
    async shell(cmd: string|string[]) {
        const res = await this.adb.subprocess.spawnAndWait(cmd);
        if(res.exitCode !== 0) {
            throw new Error(`adb command '${cmd.toString()}' exited with error code ${res.exitCode}.\n${res.stderr}`)
        }
        return res.stdout.trim();
    }
    async reboot(target?: 'fastboot'|'recovery'|'download'|'bootloader') {
        // await this.adb.power.reboot(target)
        const socket = await this.adb.createSocket(target ? `reboot:${target}` : 'reboot:system')
        try {
            await socket.close()
            this.adb.close()
        } catch(err) {
        }
        await sleep(1000)
    }
    /**
     * if this fails, with something like LIBUSB_TRANSFER_NO_DEVICE, most likely you haven't created a fresh connection via phone.getAdb() after opening the sideload
     */
    async sideload(data: Blob, onProgress: (percentage: number) => void) {
        return await adbSideload(this.adb, data, onProgress)
    }

    twrp() {
        return new TwrpHelper(this)
    }
}