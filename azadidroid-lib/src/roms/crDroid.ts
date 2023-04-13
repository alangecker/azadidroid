
import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomStability, RomVersion, versionToDate } from './common.js'


export class crDroid extends Rom {
    name = 'cdDroid'
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
        
        const file = await axios.get(link, {
            maxRedirects: 0,
            validateStatus: null
        })
        const location = file.headers.location
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

