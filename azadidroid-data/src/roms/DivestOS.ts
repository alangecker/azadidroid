import { axiosGetCached, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomBuild, RomStability, getGitlabFile, lineageToAndroidVersion, versionToDate } from './common.js'

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
    description = 'a privacy focussed LineageOS fork'
    link = ''

    getLink(codename: string) {
        return `https://divestos.org/pages/devices#device-${codename}`
    }

    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        // https://gitlab.com/divested-mobile/mirror.divestos.org/-/raw/master/update_device_info.sh
        const lines = (await getGitlabFile(43272742, 'master', 'update_device_info.sh')).split('\n')

        const bootloaderInformation = lines.find(line => line.includes(codename+'/bootloader_information'))
        const statusLines = lines.filter(line => line.includes(codename+'/status-'))
        

        const versions: Array<{version: string, versionFloat: number, status: DivestOSStatus}> = []
        for(let line of statusLines) {
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

        const page = await axiosGetCached(bypassCORS('https://divestos.org/generated/LineageOS-false.html'), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
                'Accept-Encoding': 'gzip'
            }
        })

        const out: RomBuild[] = []

        for(let v of filtered) {
            const regex = new RegExp(`&f=${codename}/divested-${v.version}-(.*?)-.*?"`, 'g')
            const files = (page.data as string).match(regex)
            if(!files) throw new Error(`DivestOS: there should be a download for ${codename} (${v.version}), but not found on the website`)

            const file = files.find(f => f.match(/-fastboot\.zip"$/)) || files[0]
            let filename = file.split('/')[1]
            filename = filename.slice(0, filename.length-1)

            const date = file.split('-')[2]

            out.push({
                date: versionToDate(date),
                version: v.version,
                androidVersion: lineageToAndroidVersion(v.version),
                state: 
                    WORKING.includes(v.status) 
                    ? RomStability.STABLE : (
                        LIKELY_WORKING.includes(v.status)
                        ? RomStability.BETA
                        : RomStability.UNTESTED
                    ),
                installMethod: filename.includes('-fastboot.zip') ? InstallationMethod.Fastboot : InstallationMethod.Recovery,
                files: {
                    rom: {
                        url: `https://divestos.org/builds/LineageOS/${codename}/${filename}`,
                        sha512: `https://divestos.org/builds/LineageOS/${codename}/${filename}.sha512sum`,
                    }
                }
            })
        }
        return out
    }
}
