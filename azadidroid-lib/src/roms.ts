import type { Rom, RomBuild } from "azadidroid-data/src/roms/common.js";
export type { Rom, RomBuild } from "azadidroid-data/src/roms/common.js";
import { roms } from "azadidroid-data/src/roms/index.js";


export function getAvailableRoms(codename: string) {
    const out: Array<{rom: Rom, versions: Promise<RomBuild[]>}> = [ ]

    for(let name in roms) {
        const promise = roms[name]
            .getAvailableBuilds(codename)
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