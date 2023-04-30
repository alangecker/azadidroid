
import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomStability, RomVersion, versionToDate } from './common.js'


export class crDroid extends Rom {
    name = 'crDroid'
    logo = ''
    description = ''
    link = ''

    installVia = InstallationMethod.Recovery

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get('https://sourceforge.net/projects/crdroid/rss?path=/' + codename)
        const links = res.data.match(/<link>(.*?)<\/link>/g)
        if(!links) return []
        const link = links.find((l: string) => l.includes('/download'))?.replace(/<.*?>/g, '')
        if(!link) return []
        
        const location = link.replace(/\/download$/, '')
        const u = new URL(location)
        const filename = u.pathname.split('/').reverse()[0]
        const date = filename.split('-')[2]
        return [
            {
                date: versionToDate(date),
                version: filename.replace(/crDroidAndroid-/, '').replace(/\.zip$/, ''),
                state: RomStability.BETA,
                url: location
            }
        ]
    }
}

