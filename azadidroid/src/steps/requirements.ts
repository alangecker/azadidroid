import { InstallContext, Step } from "./base.js"

import sleep from "../utils/sleep.js";
import { logger } from "../utils/logger.js";

export class AndroidVersionInvalidError extends Error {
    constructor(readonly requiredVersion: string) {
        super('invalidAndroidVersion')
    }
}

export class ConfirmAndroidVersionStep extends Step {
    constructor(readonly neededVersion: string) {
        super('confirm_android_version')
    }

    // ro.vendor.build.version.release == 12
    // ro.bootimage.build.version.release == 12

    // ro.vendor.build.fingerprint contains :12/
    // ro.bootimage.build.fingerprint contains :12/
    
    async run({ phone }: InstallContext) {
        if(phone.deviceMode == 'adb') {
            const adb = await phone.getAdb()
            logger.debug('connected to adb')

            const vendorRelease = await adb.getProp('ro.vendor.build.version.release')
            const bootImageRelease = await adb.getProp('ro.vendor.build.version.release')
            const vendorFingerprint = await adb.getProp('ro.vendor.build.fingerprint')
            const bootImageFingerprint = await adb.getProp('ro.bootimage.build.fingerprint')
            if(
                vendorRelease === this.neededVersion ||
                bootImageRelease === this.neededVersion ||
                vendorFingerprint.includes(':'+this.neededVersion+'/') ||
                bootImageFingerprint.includes(':'+this.neededVersion+'/')
            ) {
                return
            } else {
                // TODO: can we safely assume, that the version is wrong?
                // or is this detection method not sufficient for that?
                // throw new AndroidVersionInvalidError()
                await this.call('manualConfirm')
            }
        } else {
            await this.call('manualConfirm')
        }
    }
}


export class AllowOEMUnlockStep extends Step {
    constructor() {
        super('allow_oem_unlock')
    }

    async run(device: InstallContext, abortSignal: AbortSignal) {
        let devoptionsOpened = false
        while(true) {
            try {
                // await device.usb.waitFor('adb')
                // and is recovery
                abortSignal.throwIfAborted()

                if(!devoptionsOpened) {
                    // TODO: open dev tools via adb
                    devoptionsOpened = true
                }
                const isUnlocked = false // TODO await getOEMUnlockAllowed()
                if(isUnlocked) {
                    return
                }
            } catch(err) {
                console.error(err)
            }
            await sleep(10*1000)
            abortSignal.throwIfAborted()
        }
    }
}