import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomBuild, RomStability, lineageToAndroidVersion, versionToDate } from './common.js'


async function getArchiveRom(archiveKey: string, codename: string) {
    const res = await axios.get(bypassCORS(`https://archive.org/download/${archiveKey}/${archiveKey}_files.xml`))
    const files = Array.from((res.data as string).matchAll(/<file name="(.*?)"/g)).map(f => f[1])
        .filter(f => f.startsWith('builds/'+codename+'/') || f.startsWith('roms/'+codename+'/'))
    
    if(!files.length) return null
    
    // pick latest release
    return `https://archive.org/download/${archiveKey}/` + files[files.length-1]
}

interface LineageBuild {
    date: string,
    datetime: number,
    files: Array<{
        filename: string,
        filepath: string,
        sha1: string
        sha256: string
        size: number
        url: string
    }>
    type: 'nightly'
    version: string
}
export class Lineage extends Rom {
    name = 'LineageOS'
    logo = ''
    description = ''
    link = ''
    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        const res = await axios.get(`https://download.lineageos.org/api/v2/devices/${codename}/builds`)
        if(res.data?.length) {
            const release = res.data[0] as LineageBuild

            const files = release.files
                .reduce((o, f) => ({
                    ...o,
                    [f.filename.endsWith('.img') ? f.filename : 'rom']: {
                        url: f.url,
                        sha256: f.sha256,
                    }
                }), {})
            return [{
                date: release.date,
                state: RomStability.BETA,
                version: release.version,
                androidVersion: lineageToAndroidVersion(release.version),
                installMethod: InstallationMethod.Recovery,
                files
            }]
        }

        // not found? check archive.org
        const archivedRom = 
            // 17.1 archive?
            await getArchiveRom('lineageos171-20220217', codename) || 
            // 16.1 archive?
            await getArchiveRom('lineageos20210217', codename)

        if(!archivedRom) {
            return []
        }

        const filename = archivedRom.split('/').reverse()[0]
        const f = filename.split('-')


        return [{
            date: versionToDate(f[2]),
            state: RomStability.BETA,
            version: f[1],
            androidVersion: lineageToAndroidVersion(f[1]),
            installMethod: InstallationMethod.Recovery,
            files: {
                rom: {
                    url: archivedRom
                }
            }
        }]

    }
}
