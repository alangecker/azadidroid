import * as yaml from 'js-yaml'
import fetch from 'cross-fetch'

const LINEAGE_WIKI_BRANCH = 'master'


export interface BeforeInstallDeviceVariant {
    device: string
    firmware: string
    download_link: string
}


export interface LineageDeviceData {
    before_lineage_install?: 'ab_copy_partitions'
    before_recovery_install?: {
        instructions: 'boot_stack',
        partitions: string[]
    } | string
    before_install?: {
        instructions:"needs_specific_android_fw",
        version: string
        ships_fw?: boolean
    },
    before_install_device_variants?: BeforeInstallDeviceVariant[]
    custom_recovery_link?: string
    codename: string
    custom_unlock_cmd?: string
    download_boot?: string
    image?: string
    install_method?: string
    is_ab_device?: boolean
    name: string
    recovery_boot?: string
    recovery_reboot?: string
    recovery_partition_name?: string
    custom_recovery_codename?: string
    vendor: string
    no_oem_unlock_switch?: boolean
    is_retrofit_dynamic_partitions?: boolean
    required_bootloader?: string[]
    is_unlockable?: boolean
    models?: string[]
    soc: string
    firmware_update?: string

    // lineage specific
    maintainers?: string[]
}



let lineagewikiDevices: string[]|null = null

const ENV = (import.meta as any).env
async function loadLineageDeviceFiles() {
    const res = await fetch('https://api.github.com/repositories/79186428/contents/_data/devices', {
        headers: {
            'Authorization': ENV?.['VITE_GITHUB_TOKEN'] ? 'Bearer '+ ENV?.['VITE_GITHUB_TOKEN'] : ''
        }
    })
    const data = await res.json()
    lineagewikiDevices = data.map(d => d.name)
}

/**
 * some codenames exist as multiple variants
 */
async function getLineageCodenameFiles(codename: string): Promise<string[]> {
    if(lineagewikiDevices === null) {
        await loadLineageDeviceFiles()
    }
    return lineagewikiDevices.filter(d => d === codename+'.yml' || d.startsWith(codename+'_variant'))
}

export async function getLineageCodenames(): Promise<string[]> {
    if(lineagewikiDevices === null) {
        await loadLineageDeviceFiles()
    }

    const codenames: string[] = []
    for(let file of lineagewikiDevices) {
        const codename = file.replace(/\.yml$/, '').replace(/_variant\d+$/, '')
        if(!codenames.includes(codename)) codenames.push(codename)
    }
    return codenames
}

async function loadDeviceYaml(filename: string) {
    const res = await fetch(`https://raw.githubusercontent.com/LineageOS/lineage_wiki/${LINEAGE_WIKI_BRANCH}/_data/devices/${filename}`)
    return yaml.load(await res.text()) as LineageDeviceData
}

/**
 * combines multiple names, e.g.
 * [ 'Redmi 7A', 'Redmi 8', 'Redmi 8A', 'Redmi 8A Dual' ]
 * -> "Redmi 7A / 8 / 8A / 8A Dual"
 */
function combineNames(names: string[]) {
    if(names.length === 1) return names[0]
    let startWith = ''
    let chunks = names[0].split(' ')

    for(let chunk of chunks) {
        let allSame = true
        for(let name of names) {
            if(!name.startsWith(chunk+' ')) {
                allSame = false
                break
            }
        }
        if(allSame) {
            startWith += chunk+' '
            for(let i=0;i<names.length;i++) {
                names[i] = names[i].replace(chunk+' ', '')
            }
        }
    }

    return startWith+names.join(' / ')
}

/**
 * gets device data from lineage wiki
 * if multiple variants exist, it tries to combine them as best as possible
 */
export async function getLineageWikiDeviceData(codename: string): Promise<LineageDeviceData> {
    const files = await getLineageCodenameFiles(codename)

    if(!files.length) {
        throw new Error(`could not find device infos for '${codename}'`)
    }
    const data = await loadDeviceYaml(files[0])
    if(!data.models) data.models = []

    const names = [data.name]
    for(let file of files.slice(1)) {
        const additionalData = await loadDeviceYaml(file)
        if(!names.includes(additionalData.name)) names.push(additionalData.name)
        if(additionalData.models) {
            for(let m of additionalData.models) {
                if(!data.models.includes(m)) data.models.push(m)
            }
        }
        if(additionalData.before_install_device_variants) {
            data.before_install_device_variants.push(...additionalData.before_install_device_variants)
        }
        if(!data.image && additionalData.image) {
            data.image = additionalData.image
        }
    }
    data.name = combineNames(names)
    return data
}