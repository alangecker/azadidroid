import { ModelInfos } from "../model/ModelInfos.js"
import { roms } from "../roms/index.js"

async function main() {
    const codename = process.argv[2]
    if(!codename?.length) {
        console.error('Usage: yarn find-roms CODENAME [ROM]')
        process.exit(1)
    }

    const model = await ModelInfos.get(codename)

    console.log('---------------------------------------------')
    console.log(`${model.vendor} ${model.name} [${model.codename}]`)
    console.log('---------------------------------------------')

    const romNames = process.argv[3] ? [process.argv[3]] : Object.keys(roms)

    const notAvailable: string[] = []
    const promises = romNames.map(async (name) => {
        const rom = roms[name]
        try {
            const builds = await rom.getAvailableBuilds(codename)

            if(!builds.length) {
                notAvailable.push(name)
            }
            for(let build of builds) {
                console.log(`* ${name}${build.variant ? ` (${build.variant})` : ''} ${build.version}${build.androidVersion ? ' ('+build.androidVersion+')' : ''} [${build.date ? build.date+'/' : ''}${build.state}]`)
            }
        } catch(err) {
            // console.error(`[${name}] Error: `, err.message)
            notAvailable.push(name)
        }
    })
    await Promise.all(promises)
    if(notAvailable.length) {
        console.log('\nNo Build available from following ROMs: '+notAvailable.join(', '))
    }
}


main().catch((err) => {
    console.log(err)
})