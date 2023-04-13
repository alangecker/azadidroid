import { InstallContext, Step } from "./base.js"

import sleep from "../utils/sleep.js";
import { logger } from "../utils/logger.js";
import { DeviceMode } from "../usb/helpers.js";

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

    async run(ctx: InstallContext, abortSignal: AbortSignal) {
        let devoptionsOpened = false
        if(ctx.phone.deviceMode === DeviceMode.FASTBOOT) {
            if(ctx.model.unlockCommand == 'oem unlock') {
                // TODO
                // fastboot oem device-info
                // (bootloader) 	Device tampered: false
                // (bootloader) 	Device unlocked: true
                // (bootloader) 	Device critical unlocked: true
                // (bootloader) 	Charger screen enabled: false

                logger.warn('checking oem unlock status is not implemented yet')
                logger.warn('we just assume its enabled')
            }  else {
                const fastboot = await ctx.phone.getFastboot()
                await fastboot.reboot('bootloader', true)

                const isUnlocked = await fastboot.getVariable('unlocked')
                if(isUnlocked === 'yes') {
                    // device is already unlocked
                    return
                }
                const res = (await fastboot.runCommand('flashing get_unlock_ability')).text.trim()
                logger.debug('flashing get_unlock_ability response', res)
                if(res === 'get_unlock_ability: 1') {
                    logger.debug('OEM Unlock is enabled')
                } else if(res === 'get_unlock_ability: 0') {
                    throw new Error('OEM Unlock is not enabled. Manually boot into ROM and try again')
                } else {
                    logger.debug('unknown response. we just assume, that OEM is unlocked') // TODO
                }
            }
        } else if(ctx.phone.deviceMode === DeviceMode.ODIN) {
            // TODO: implement checking of unlock status in download mode
            return
        } else {
            while(true) {
                try {
                    const adb = await ctx.phone.getAdb()
                    logger.debug('connected to adb')
    
                    if(adb.isRecovery) {
                        // when we reached the recovery mode, OEM is implicitly unlocked
                        return
                    }
                    
                    abortSignal.throwIfAborted()
                    const isUnlocked = await adb.getProp('sys.oem_unlock_allowed') // TODO: works for Pixel devices. also for others?
                    logger.debug('isUnlocked', { isUnlocked })
                    if(isUnlocked === '' || isUnlocked === '1') {
                        // device seems to be unlocked
                        return
                    }
    
                    if(!devoptionsOpened) {
                        // TODO: open dev tools via adb
                        logger.debug('device is not unlocked. opening dev tools for easier access')
                        await adb.shell('am start -n com.android.settings/.Settings\\$DevelopmentSettingsDashboardActivity')
                        await this.call('manualEnableOEMUnlock')
                        devoptionsOpened = true
                    }
    
                } catch(err) {
                    console.error(err)
                }
                await sleep(10*1000)
                abortSignal.throwIfAborted()
            }
        }
    }
}