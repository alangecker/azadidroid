
import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomBuild, RomStability, RomVersion, lineageToAndroidVersion, versionToDate } from './common.js'


export class crDroid extends Rom {
    name = 'crDroid'
    logo = ''
    description = 'crDroid is based on the LineageOS & Android Open Source Project with extra contributions from many people within the Android community.'
    link = ''

    getLink(codename: string): string {
        return `https://crdroid.net/downloads#${codename}`
    }
  
    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        const res = await axios.get(bypassCORS('https://sourceforge.net/projects/crdroid/rss?path=/' + codename), {
            validateStatus: (status) => status === 200 || status === 404
        })

        if(res.status === 404) return []
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
            androidVersion: parseInt(f[1]).toString(),
            installMethod: InstallationMethod.Recovery,
            files: {
                rom: {
                    url: location
                }
            }
        }]
    }
}

