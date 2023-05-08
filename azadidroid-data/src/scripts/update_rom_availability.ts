import { getModelIndex } from "../model/models.js";
import { roms } from "../roms/index.js";
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, '../roms-list.json')

const modelIndex = getModelIndex()


interface Device {
    code: string
    android: number
    roms: string[]
}
interface ScrapedBuildIndex {
    scrapeDate: string
    devices: Device[]
}


function versionMax(a: string, b: string) {
    if(!b) return a
    if(!a) return b
    if(parseFloat(b) > parseFloat(a)) return b
    return a
}

async function main() {

    const devices: Device[] = []

    const romDeviceCount: {[rom: string]: number} = {}

    for(let name in roms) {
        romDeviceCount[name] = 0
    }

    for(let i=0;i<modelIndex.length;i++) {
        const m = modelIndex[i]
        console.log(`${i}/${modelIndex.length} ${m.vendor} ${m.name} (${m.code})`)
        let builds: string[] = []
        let highestVersion: string
        const promises = Object.keys(roms).map(async (name) => {
            try {
                const res = await roms[name].getAvailableBuilds(m.code)
                if(res.length) {
                    romDeviceCount[name]++
                    builds.push([
                        name,
                        res[0].version
                    ].join(':'))
                    highestVersion = versionMax(highestVersion, res[0].androidVersion)
                }
            } catch(err) {
                // console.log(err.code, err.message)
            }
        })
        await Promise.all(promises)

        if(builds.length) {
            devices.push({
                code: m.code,
                android: parseInt(highestVersion),
                roms: builds.sort() // sorted, to avoid unnecessary git file changes due to random order of parallel promises
            })
            console.log(' > ' + builds.join(', '))
        }
    }

    const index: ScrapedBuildIndex = {
        scrapeDate: (new Date).toISOString(),
        devices
    }

    fs.writeFileSync(file, JSON.stringify(index, null, 2), 'utf-8')

    console.log('Supported devices by ROM:')
    for(let name in romDeviceCount) {
        console.log(`- ${romDeviceCount[name]} ${name}`)
    }
}

main()
