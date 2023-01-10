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

    async run(device: InstallContext) {
        throw new Error('unimplemented')
        // const promise = new CancelablePromise(async (resolve, reject) => {
        //     let unlockCommandTriggered = false

        //     while(!promise.isCanceled()) {
        //         try {
        //             // await device.usb.waitFor('fastboot')
        //             if(promise.isCanceled()) return
        //             const isUnlocked = false // await fastboot.getUnlockStatus()
        //             if(isUnlocked) {
        //                 resolve('ok')
        //                 return
        //             } else if (!unlockCommandTriggered) {
        //                 try {
        //                     // fastboot oem unlock
        //                 } catch(err) {
        //                     reject(err)
        //                     return
        //                 }
        //                 unlockCommandTriggered = true
        //             }
        //         } catch(err) {
        //             console.error(err)
        //         }
        //         await sleep(500)
        //     }
        // })
        // return promise
    }
}

// export class FastbootMotorolaUnlockStep extends Step {
//     constructor() {
//         super('fastboot_unlock')
//     }
//     unlockString: string = ''
// }