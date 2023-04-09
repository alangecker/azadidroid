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
        await this.formatData()
        await this.wipePartition('cache')
        await this.wipePartition('dalvik')
        try {
            await this.wipePartition('data')
        } catch(err) {
            // No big deal because the data partition has
		    // been formatted successfully already
		    logger.debug("Error wiping the data partition. This is no big deal because it has just been formatted successfully.", err)
        }
    }
    async wipePartition(name: string) {
        logger.debug("wiping partition", name)
        await this.adb.shell(["twrp", "wipe", name])
        await sleep(500)
    }

    async formatData() {
        try {
            if(await this.isDataMounted()) {
                logger.debug("unmount /data")
                await this.adb.shell(['umount', '/data'])
            }
        } catch(_) {}

        try {
            await this.formatDataORS()
        } catch(_) {
            await this.formatDataOldschool()
        }

        try {
            if(!await this.isDataMounted()) {
                logger.debug("mount /data")
                await this.adb.shell(['mount', '/data'])
            }
        } catch(_) {}
    }

    private async isDataMounted() {
        const mounts = await this.adb.shell(["cat", "/proc/mounts"])
        return mounts.split('\n').find(line => line.includes(' /data '))
    }

    private async formatDataORS() {
        logger.debug("format data")
        const stdout = await this.adb.shell(["twrp", "format", "data"])
        if(stdout.includes("Unrecognized script command")) {
            throw new Error("Unrecognized script command: adb shell twrp format data")
        }
    }
    private async formatDataOldschool() {
        logger.debug("format data (old school)")
        const { pathCandidates, fsCandidates } = await this.findDataCandidates()
        
        for(const dataFs of fsCandidates) {
            for(const dataPath of pathCandidates) {
                logger.debug("Attempting to format", dataPath, "as", dataFs)    

                if(dataFs === "f2fs") {
                    try {
                        const res = await this.adb.shell(["mkfs.f2fs", "-t", "0", dataPath])
                        if(res.includes('format successful')) {
                            return
                        } else {
                            logger.debug("Did not seem to work:\n", res)
                        }
                    } catch(err) {
                        logger.debug("Format error:", err)
                    }
                } else if(dataFs === "ext4") {
                    try {
                        const res = await this.adb.shell(["make_ext4fs", dataPath])
                        if(res.match(/format successful|Created filesystem with/)) {
                            return
                        } else {
                            logger.debug("Did not seem to work:\n", res)
                        }
                    } catch(err) {
                        logger.debug("Format error:", err)
                    }
                } else if(dataFs === "") {
                    throw new Error("Unknown data partition filesystem")
                } else {
                    throw new Error("Unable to format data to " + dataFs)
                }
            }
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
}