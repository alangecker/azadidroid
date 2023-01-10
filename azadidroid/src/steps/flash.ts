import axios from "axios"
import { Rom } from "../roms/index.js"
import { DeviceMode } from "../usb/helpers.js"
import { bypassCORS } from "../utils/fetch.js"
import { logger } from "../utils/logger.js"
import sleep from "../utils/sleep.js"
import { InstallContext, IDownloadRequest, Step } from "./base.js"


async function getRecoveryFile(ctx: InstallContext): Promise<IDownloadRequest> {
    const codename = ctx.model.recoveryCodename
    const res = await axios(bypassCORS(`https://dl.twrp.me/${codename}/`))
    const version = res.data.match(/">(twrp-(.*?).img)<\/a>/)
    const filename = version[1]
    return {
        key: "recovery",
        title: "Recovery (TWRP)",
        fileName: filename,
        url: `https://dl.twrp.me/${codename}/${filename}`,
        sha256: `https://dl.twrp.me/${codename}/${filename}.sha256`,
        additionalHeaders: {
            'Referer': 'https://dl.twrp.me/'
        }
    }
}

export class OdinFlashRecoveryStep extends Step {
    constructor() {
        super('odin_flash_recovery')
    }
    async getFilesToDownload(device: InstallContext) {
        return [
            await getRecoveryFile(device)
        ]
    }
    async run(ctx: InstallContext, abortSignal: AbortSignal) {
        await ctx.phone.waitFor('odin')
        const odin = await ctx.phone.getOdin()
        abortSignal.throwIfAborted()
        logger.debug('beginn session')
        await odin.beginSession()
        logger.debug('flash recovery')
        await odin.flash({
            RECOVERY: new Uint8Array(await ctx.files['recovery'].arrayBuffer())
        })
        logger.debug('end session end turn off')
        await odin.endSession()
        await odin.shutdown()
    }
}

export class FastbootFlashRecoveryStep extends Step {
    constructor() {
        super('fastboot_flash_recovery')
    }
    async getFilesToDownload(device: InstallContext) {
        return [
            await getRecoveryFile(device)
        ]
    }
    async run(device: InstallContext) {
        throw new Error('unimplemented')
        // const promise = new CancelablePromise(async (resolve, reject) => {
        //     try {
        //         // TODO: await device.usb.waitFor('fastboott')
        //         if(promise.isCanceled()) return
        //         // TODO: fastboot flash recovery
        //         if(promise.isCanceled()) return
        //         // TODO: fastboot reboot recovery
        //         resolve('ok')
        //     } catch(err) {
        //         reject(err)
        //     }
        // })
        // return promise
    }
}

export class RebootOdinToRecoveryStep extends Step {
    constructor() {
        super('reboot_to_recovery')
    }

    async run(ctx: InstallContext, abortSignal: AbortSignal) {
        while(true) {
            await ctx.phone.waitFor('adb')
            // sometimes TWRP disconnects again shortly
            await sleep(1000)
            await ctx.phone.waitFor('adb')
            const adb = await ctx.phone.getAdb()
            abortSignal.throwIfAborted()
            if(adb.isRecovery) {
                return
            }
            await sleep(500)
        }
    }
}



export class ABCopyPartitionsStep extends Step {
    constructor() {
        super('ab_copy_partitions')
    }
    async getFilesToDownload(device: InstallContext) {
        return [
            {
                key: "copy-partitions",
                title: "Copy AB Partition Helper",
                fileName: "copy-partitions-20220613-signed.zip",
                url: "https://mirrorbits.lineageos.org/tools/copy-partitions-20220613-signed.zip",
                sha256: "92f03b54dc029e9ca2d68858c14b649974838d73fdb006f9a07a503f2eddd2cd"
            }
        ]
    }
    async run(device: InstallContext) {
        throw new Error('unimplemented')
        // const promise = new CancelablePromise(async (resolve, reject) => {
        //     try {
        //         // TODO
        //         // adb sideload this.getDownloadedBlob('copy-partitions')
        //     } catch(err) {
        //         reject(err)
        //     }
        // })
        // return promise
    }
}

export class TWRPWipeStep extends Step {
    constructor() {
        super('twrp_wipe')
    }
    async run(ctx: InstallContext) {
        await ctx.phone.waitFor('adb')
        const adb = await ctx.phone.getAdb()
        await adb.twrp().wipe()
    }
}

export class FastbootRetrofitDynamicPartitionsStep extends Step {
    constructor() {
        super('retrofit_dynamic_partitions')
    }
    async getFilesToDownload(device: InstallContext) {

        return [
            {
                key: "super_empty",
                title: "Retrofit Dynamic Paritions Image",
                fileName: "super_empty.img",
                url: `https://mirrorbits.lineageos.org/full/${device.model.codename}/????/super_empty.img`,
            }
        ]
    }
    async run(device: InstallContext) {
        throw new Error('unimplemented')
        // const promise = new CancelablePromise(async (resolve, reject) => {
        //     try {
        //         // TODO
        //         // adb reboot bootloader
        //         // fastboot wipe-super super_empty.img
        //         // fastboot reboot recovery
        //         // waitFor('adb')
        //         // isRecovery
        //     } catch(err) {
        //         reject(err)
        //     }
        // })
        // return promise
    }
}

export class TWRPInstallROMStep extends Step {
    constructor() {
        super('twrp_install_rom')
    }
    async getFilesToDownload(ctx: InstallContext) {
        const url = new URL(ctx.versionToInstall.url)
        const p = url.pathname.split('/')
        return [
            {
                key: 'rom',
                title: ctx.rom.name,
                fileName: p[p.length-1],
                url: url.toString(),
                sha256: ctx.versionToInstall.sha256,
                sha512: ctx.versionToInstall.sha512
            }
        ]
    }
    async run(ctx: InstallContext, abortSignal: AbortSignal) {
        let adb = await ctx.phone.getAdb()
        logger.debug('opening sideload...')
        await adb.twrp().openSideload()
        logger.debug('waiting for adb...')
        await ctx.phone.waitFor('adb');
        
        // after starting the sideload mode, the device reconnected in a different configuration
        // which requires us to get a fresh adb instance (without initially retrieving the props)
        logger.debug('get fresh adb instance...')
        
        adb = await ctx.phone.getAdb(false)
        abortSignal.throwIfAborted()

        logger.debug(`sideloading rom... (size: ${ctx.files['rom'].size} bytes)`)
        await adb.sideload(ctx.files['rom'], (percentage) => {
            this.call('progress', percentage)
        })
        logger.debug('sideload done')

        // wait until phone reconnected back in normal adb mode
        await sleep(1000)
        await ctx.phone.waitFor('adb');
    }
}

export class TWRPFinishStep extends Step {
    constructor() {
        super('twrp_finish')
    }

    async run(ctx: InstallContext) {
        await ctx.phone.waitFor('adb')
        const adb = await ctx.phone.getAdb()
        await adb.reboot()
        await sleep(1000)
    }
}