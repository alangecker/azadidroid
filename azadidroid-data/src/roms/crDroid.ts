
import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomBuild, RomStability, RomVersion, lineageToAndroidVersion, versionToDate } from './common.js'


export class crDroid extends Rom {
    name = 'crDroid'
    logo = ''
    description = ''
    link = ''
  
    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        const res = await axios.get('https://sourceforge.net/projects/crdroid/rss?path=/' + codename)
        const links = res.data.match(/<link>(.*?)<\/link>/g)
        if(!links) return []
        const link = links.find((l: string) => l.includes('/download'))?.replace(/<.*?>/g, '')
        if(!link) return []
        
        const location = link.replace(/\/download$/, '')
        const u = new URL(location)
        const filename = u.pathname.split('/').reverse()[0]
        const f = filename.split('-')

        return [{
            date: versionToDate(f[2]),
            state: RomStability.BETA,
            version: f[1],
            androidVersion: lineageToAndroidVersion(f[1]),
            installMethod: InstallationMethod.Recovery,
            files: {
                rom: {
                    url: location
                }
            }
        }]
    }
}

