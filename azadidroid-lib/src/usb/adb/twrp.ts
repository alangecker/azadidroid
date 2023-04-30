import { logger } from "../../utils/logger.js";
import sleep from "../../utils/sleep.js";
import type { AdbWrapper } from "./AdbWrapper.js";


function onlyUnique(value: any, index: number, self: any[]) {
    return self.indexOf(value) === index;
}

/**
 * thankfully adapted from
 * https://github.com/amo13/Anarchy-Droid/blob/master/get/twrp.go
 */
export class TwrpHelper {
    constructor(readonly adb: AdbWrapper) {}

    async wipe() {
        await this.wipePartition('cache')
        await this.wipePartition('dalvik')
        await this.wipePartition('data')
        
        // shrink data filesystem to avoid issues with encryption
        await this.shrinkDataFs()
    }
    async wipePartition(name: string) {
        logger.debug(`wiping partition '${name}'...`)
        await this.adb.shell(["twrp", "wipe", name])
        logger.debug(`wiping partition '${name}' done`)
        await sleep(500)
    }

    async isStarted() {
        try {
            // TWRP is printing following line into the log when switching 
            // from the splash screen to the actual menu
            const guiLoaded = await this.adb.shell('grep "Switching packages (TWRP)" /tmp/recovery.log')
            return guiLoaded.includes("Switching packages")
        } catch(_) {
            return false
        }
     }

    private async findDataCandidates() {
        const pathCandidates: string[] = []
        const fsCandidates: string[] = []
    
        // first possibility
        const fstab = await this.adb.shell('cat /etc/fstab')
        for(let line of fstab.split('\n')) {
            const l = line.split(/\s+/)
            if(l[1] === '/data') {
                pathCandidates.push(l[0])
                if(l[2]) {
                    fsCandidates.push(l[2])
                }
                break
            }
        }

        // second possibility
        const recoveryFstab = await this.adb.shell('cat /etc/recovery.fstab')
        for(let line of recoveryFstab.split('\n')) {
            const l = line.split(/\s+/)
            if(l[0] === '/data') {
                pathCandidates.push(l[2])
                fsCandidates.push(l[1])
            }
        }

        // third possibility
        const log = await this.adb.shell('cat /tmp/recovery.log')
        for(let line of log.split('\n')) {
            if(line.startsWith('/data | /dev/')) {
                const l = line.split(/\s+/)
                if(l[2].startsWith('/dev/')) {
                    pathCandidates.push(l[2])
                }
            }
        }
        return {
            pathCandidates: pathCandidates.filter(onlyUnique),
            fsCandidates: fsCandidates.filter(onlyUnique)
        }
    }

    async openSideload() {
        logger.debug('twrp sideload')
        this.adb.shell(["twrp", "sideload"])
            .catch((err) => logger.error(err))
        logger.debug('sleep 1000ms')
        await sleep(1000)
        logger.debug('sleep ended')
    }

    /**
     * on some devices the encryption fails due to not enough space at the end of the partition
     * shrinking the partition by some bytes solves that
     * https://gitlab.com/LineageOS/issues/android/-/issues/338
     */
    private async shrinkDataFs() {
        await this.adb.shell(['umount', '/data', '/sdcard', '/userdata']).catch(() => {})

        const { pathCandidates } = await this.findDataCandidates()

        for(let path of pathCandidates) {
            try {
                // get current block count
                const size = parseInt(await this.adb.shell(`tune2fs -l ${path} | grep "Block count" | awk -F: '{print $2}'`))
                if(!size) continue

                // run e2fsck first (required by resize2fs)
                logger.debug(await this.adb.shell(`e2fsck -f -p ${path}`))

                // shrink filesystem
                logger.debug(await this.adb.shell(['resize2fs', path, (size - 16).toString()]))

                return
            } catch(err) {
                logger.debug(err)
            }
        }
        
        logger.debug("could not shrink /data, this might be no issue on this device")
    }
}