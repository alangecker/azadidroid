import { axios, bypassCORS } from '../utils/fetch.js'
import { Rom, RomStability, RomVersion, versionToDate } from './common.js'

/**
 * Source: https://gitlab.com/divested-mobile/divestos-website/-/blob/master/pages/devices.html#L272
 */
enum DivestOSStatus {
    TestedWorking = 0,
    TestedWorkingExperimental = 6,
    ReportedWorking = 7,
    VeryLikelyWorking = 8,
    LikelyWorking = 4,
    MostlyWorking = 5,
    Untested = 2,
    UntestedExperimental = 3,
    LikelyWorkingExperimental = 10,
    Broken = 1,
}

const WORKING = [
    DivestOSStatus.TestedWorking,
    DivestOSStatus.TestedWorkingExperimental,
    DivestOSStatus.ReportedWorking,
]

const LIKELY_WORKING = [
    DivestOSStatus.VeryLikelyWorking,
    DivestOSStatus.LikelyWorking,
    DivestOSStatus.MostlyWorking,
    DivestOSStatus.LikelyWorkingExperimental,
]

const UNTESTED = [
    DivestOSStatus.Untested,
    DivestOSStatus.UntestedExperimental,
]

export class DivestOS extends Rom {
    name = 'DivestOS'
    logo = ''
    description = ''
    link = ''

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get(`https://gitlab.com/divested-mobile/divestos-website/-/raw/master/update_device_info.sh`, {
            headers: {
                'Accept-Encoding': 'gzip'
            }
        })

        const lines = res.data.split('\n')
            .filter(line => line.includes(codename+'/status-'))
        

        const versions: Array<{version: string, versionFloat: number, status: DivestOSStatus}> = []
        for(let line of lines) {
            const v = line.match(/echo (\d) .*status-([\d\.]+)/)

            versions.push({
                version: v[2],
                versionFloat: parseFloat(v[2]),
                status: parseInt(v[1])
            })
        }

        const filtered = versions
            .sort((a,b) => b.versionFloat-a.versionFloat)
            .filter(v => v.status !== DivestOSStatus.Broken)

        if(!filtered.length) return []

        const page = await axios(bypassCORS('https://divestos.org/index.php?page=devices&base=LineageOS&golden=false'), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
                'Accept-Encoding': 'gzip'
            }
        })

        const out: RomVersion[] = []

        for(let v of filtered) {
            const regex = new RegExp(`&f=${codename}/divested-${v.version}-(.*?)-.*?"`)
            const file = page.data.match(regex)
            if(!file) throw new Error(`DivestOS: there should be a download for ${codename} (${v.version}), but not found on the website`)
            const date = file[1]
            let filename = file[0].split('/')[1]
            filename = filename.slice(0, filename.length-1)

            out.push({
                date: versionToDate(date),
                version: v.version,
                state: 
                    WORKING.includes(v.status) 
                    ? RomStability.STABLE : (
                        LIKELY_WORKING.includes(v.status)
                        ? RomStability.BETA
                        : RomStability.UNTESTED
                    ),
                url: `https://divestos.org/builds/LineageOS/${codename}/${filename}`,
                sha512: `https://divestos.org/builds/LineageOS/${codename}/${filename}.sha512sum`
            })
        }
        return out
    }
}
