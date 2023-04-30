import { axios } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomStability, RomVersion, versionToDate } from './common.js'

interface GithubReleaseAsset {
    name: string
    browser_download_url: string
}
interface GithubRelease {
    name: string
    tag_name: string
    assets: GithubReleaseAsset[]
}

function assetSorter(a: GithubReleaseAsset, b: GithubReleaseAsset) {
    const at = a.name.split('-')[1]?.split('.')
    const bt = b.name.split('-')[1]?.split('.')
    if(!at || !bt) return 0
    if(at[0] !== bt[0]) return parseInt(bt[0])-parseInt(at[0])
    if(at[1] !== bt[1]) return parseInt(bt[1])-parseInt(at[1])
    return 0
}

export class IodeOS extends Rom {
    name = 'iodéOS'
    logo = ''
    description = ''
    link = ''

    installVia = InstallationMethod.Bootloader

    async isBootloaderRelockSupported(codename: string) {
        return true
    }

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get(`https://api.github.com/repos/iodeOS/ota/releases?per_page=100`, {
            headers: {
                'Accept-Encoding': 'gzip'
            }
        })
        for(let release of res.data as GithubRelease[]) {
            const t = release.tag_name.split('-')
            if(t[0] === 'v1') {
                // ignore v1 releases, because file name schema was different
                continue
            }
            if(t[1] !== codename) continue
            const assets = release.assets.sort(assetSorter)
            
            const recovery = assets.find(a => a.name.match(/recovery\.img$/))
            const fastboot = assets.find(a => a.name.match(/fastboot\.zip$/))
            const zip = assets.find(a => a.name.match(/\.zip$/) && !a.name.match(/fastboot\.zip$/))

            if(fastboot) {
                const f = fastboot.name.split('-')
                return [
                    {
                        version: f[1]+'-'+f[2],
                        date: versionToDate(f[2]),
                        state: RomStability.STABLE,
                        url: fastboot.browser_download_url
                    }
                ]
            } else if(recovery && zip) {
                const f = zip.name.split('-')
                return [
                    {
                        version: f[1]+'-'+f[2],
                        date: versionToDate(f[2]),
                        state: RomStability.STABLE,
                        url: zip.browser_download_url,
                        installVia: InstallationMethod.Recovery
                    }
                ]
            }
        }
        return []
    }
}