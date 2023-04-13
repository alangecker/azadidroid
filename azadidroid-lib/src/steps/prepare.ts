import { DeviceMode } from "../usb/helpers.js"
import { logger } from "../utils/logger.js"
import sleep from "../utils/sleep.js"
import { InstallContext, Step } from "./base.js"


export class WaitForBootloaderStep extends Step {
    constructor() {
        super('wait_for_bootloader')
    }
    async run(ctx: InstallContext) {
        while(
            ctx.phone.deviceMode !== DeviceMode.FASTBOOT &&
            ctx.phone.deviceMode !== DeviceMode.ODIN
        ) {
            if(ctx.phone.deviceMode == 'adb') {
                const adb = await ctx.phone.getAdb()
                if(ctx.model.installMethod == 'heimdall') {
                    logger.debug('reboot into odin...')
                    await adb.reboot('download')
                    await ctx.phone.waitFor('odin')
                } else {
                    logger.debug('reboot into fastboot...')
                    await adb.reboot('bootloader')
                    await ctx.phone.waitFor('fastboot')
                }
            }
        }
    }
}


export class FastbootUnlockStep extends Step {
    constructor() {
        super('fastboot_unlock')
    }

    async run(ctx: InstallContext, abortSignal: AbortSignal) {
        const fastboot = await ctx.phone.getFastboot()

        const isUnlocked = await fastboot.getVariable('unlocked')
        if(isUnlocked === 'yes') {
            // already unlocked
            return
        }

        if(ctx.model.installMethod == 'fastboot_motorola') {
            throw new Error('unlocking motorola devices is not supported yet')
        }

        await fastboot.runCommand(ctx.model.unlockCommand)
        this.call('confirmUnlock')
        await fastboot.waitForConnect();

        const isUnlocked2 = await fastboot.getVariable('unlocked')
        if(isUnlocked2 !== 'yes') {
            throw new Error('device should now be unlocked, but it is not. Are you sure, that you confirmed the on-screen unlock prompt?')
        }
    }
}

// export class FastbootMotorolaUnlockStep extends Step {
//     constructor() {
//         super('fastboot_unlock')
//     }
//     unlockString: string = ''
// }