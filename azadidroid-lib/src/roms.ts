import { Rom, RomVersion } from "azadidroid-data/src/roms/common.js";
import { roms } from "azadidroid-data/src/roms/index.js";
export { Rom, RomVersion } from "azadidroid-data/src/roms/common.js";


export function getAvailableRoms(codename: string) {
    const out: Array<{rom: Rom, versions: Promise<RomVersion[]>}> = [ ]

    for(let name in roms) {
        const promise = roms[name]
            .getAvailableVersions(codename)
            .catch((err) => {
                return []
            })
        out.push({
            rom: roms[name],
            versions: promise
        })
    }
    return out
}