import { axios, bypassCORS } from '../utils/fetch.js'
import { Rom, RomStability, RomVersion, versionToDate } from './common.js'


async function getArchiveRom(archiveKey: string, codename: string) {
    const res = await axios.get(`https://archive.org/download/${archiveKey}/${archiveKey}_files.xml`)
    const files = Array.from((res.data as string).matchAll(/<file name="(.*?)"/g)).map(f => f[1])
        .filter(f => f.startsWith('builds/'+codename+'/') || f.startsWith('roms/'+codename+'/'))
    
    if(!files.length) return null
    
    // pick latest release
    return `https://archive.org/download/${archiveKey}/` + files[files.length-1]
}
export class Lineage extends Rom {
    name = 'LineageOS'
    logo = ''
    description = ''
    link = ''

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get(bypassCORS(`https://download.lineageos.org/api/v1/${codename}/nightly/*`))
        const response = res.data?.response
        if(response?.length) {
            // a up to date release was found
            const release = response[response.length-1]
            return [{
                date: new Date(release.datetime*1000).toISOString().slice(0,10),
                version: release.version,
                url: release.url,
                sha256: release.id,
                state: RomStability.BETA,
            }]
        }

        // not found? check archive.org
        const archivedRom = 
            // 17.1 archive?
            await getArchiveRom('lineageos171-20220217', codename) || 
            // 16.1 archive?
            await getArchiveRom('lineageos20210217', codename)
    
        if(!archivedRom) return []

        const filename = archivedRom.split('/').reverse()[0]
        const f = filename.split('-')
        return [{
            date: versionToDate(f[2]),
            version: f[1]+'-'+f[2],
            url: archivedRom,
            state: RomStability.BETA,
        }]
    }
}

// https://github.com/pharuxtan/androidbot/tree/d64984f8bab12f0bee201561c90ec357efbcb167/commands/roms