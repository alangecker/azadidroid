import axios from 'axios'
import * as yaml from 'js-yaml'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url';
import { ModelInfos } from '../model/ModelInfos.js';
import { ModelSummary } from '../model/models.js';
import { getLineageCodenames } from '../model/lineageWiki.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getCalyxOSList(): Promise<Array<{name: string, brand: string, codename: string}>> {
    const res = await axios('https://gitlab.com/CalyxOS/calyxos.org/-/raw/main/pages/_data/downloads.yml', {headers: { 'Accept-Encoding': 'none' }})
    const data = yaml.load(res.data) as any
    return data.stable
}

interface DivestOSDevice {
    code: string
    name?: string
    bootloader?: string[]
    status: {[version: string]: number}
}

async function getDivestOsList(): Promise<DivestOSDevice[]> {
    const res = await axios('https://gitlab.com/divested-mobile/mirror.divestos.org/-/raw/master/update_device_info.sh', {headers: { 'Accept-Encoding': 'none' }})

    const output: {[code: string]: DivestOSDevice} = {}
    for(let line of res.data.split('\n')) {
        const m = line.match(/^echo (-e |)(.*)>(.*?)(;|$)/)
        if(!m) continue
        
        const [code, file] = m[3].trim().split('/')
        if(!output[code]) output[code] = { code, status: {} }
        const data = m[2].trim().replace(/(^"|"$)/g, '')
        if(file == 'bootloader_information') {
            output[code].bootloader = data.split('\\n')
        } else if(file == 'friendlyName') {
            output[code].name = data
        } else if(file.startsWith('status-')) {
            output[code].status[file.slice(7)] = parseInt(data)
        }
    }
    return Object.values(output)

}

const file = path.join(__dirname, '../model/model_index.json')


let list: ModelSummary[] = []

async function read() {
    list = JSON.parse(fs.readFileSync(file, 'utf-8')) as ModelSummary[]
}
async function save() {
    fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf-8')
}

async function main() {
    // read()

    // lineage
    const codenames = await getLineageCodenames()
    for(const code of codenames) {
        console.log(`lineage: get data for ${code}`)
        try {
            const model = await ModelInfos.get(code)
            list.push({
                code,
                vendor: model.vendor,
                name: model.name,
                method: model.installMethod.startsWith('fastboot') ? 'fastboot' : model.installMethod,
                models: model.models
            })
            // console.log(list[list.length-1]) 
        } catch(err) {
            console.log(err.message)
        }
    }

    // add from calyxos
    const calyxDevices = await getCalyxOSList()
    console.log('get calyxos devices')
    for(const device of calyxDevices) {
        const m = list.find((m) => m.code == device.codename)
        if(!m)  {
            const vendor = device.brand == 'pixel' ? 'Google' : device.brand[0].toLocaleUpperCase()+device.brand.slice(1)
            list.push({
                code: device.codename,
                vendor: vendor,
                name: device.name,
                models: [],
                method: 'fastboot_nexus'
            })
        }
    }

    // add from divestos
    const divestDevices = await getDivestOsList()
    for(const device of divestDevices) {
        const m = list.find((m) => m.code.toLowerCase() == device.code.toLowerCase())
        if(!m) {
            if(!device.name) continue
            if(!device.bootloader[0] || !device.bootloader[0].match(/fastboot|heimdall/i)) continue

            const vendor = device.name.split(' ', 1)[0]
            const product = device.name.slice(vendor.length+1)
            let installMethod = device.bootloader[0].toLowerCase()
            if(installMethod.includes('fastboot')) installMethod = 'fastboot'
            
            list.push({
                code: device.code,
                vendor,
                name: product,
                method: installMethod,
                models: []
            })
        }
    }
    console.log(`found ${list.length} devices`)
    save()
}


main()                                                                                                                                                                                                                                
