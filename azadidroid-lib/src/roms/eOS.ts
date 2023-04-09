import { axios, bypassCORS } from '../utils/fetch.js'
import { Rom, RomAvailability, RomStability, RomVersion, Version, versionToDate } from './common.js'
import * as yaml from 'js-yaml'


export class eOS extends Rom {
    name = '/e/ OS'
    logo = ''
    description = ''
    link = ''

    private async getVersion(codename: string, channel: 'dev'|'stable'): Promise<RomVersion> {
        const res = await axios.get(bypassCORS(`https://images.ecloud.global/${channel}/${codename}/`))

        const filename = res.data.match(/href=(e-.*?)>/)?.[1]
        if(!filename) throw new Error('no file found in /e/ OS device page')
        
        const [e, version, androidMajor, date ] = filename.split('-')

        return {
            date: versionToDate(date),
            version: version + '-' + androidMajor,
            state: channel === 'stable' ? RomStability.STABLE : RomStability.BETA,
            url: `https://images.ecloud.global/${channel}/${codename}/${filename}`,
            sha256: `https://images.ecloud.global/${channel}/${codename}/${filename}.sha256sum`
        }
    }
    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const out = [await this.getVersion(codename, 'dev')]
        try {
            out.push(await this.getVersion(codename, 'stable'))
        } catch(err) {}

        return out
    }
}
