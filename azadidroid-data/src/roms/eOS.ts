import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomAvailability, RomBuild, RomStability, RomVersion, Version, versionToDate } from './common.js'
import * as yaml from 'js-yaml'


const letterAndroidVersionMapping = {
    m: '6.0.x',
    n: '7',
    o: '8',
    p: '9',
    q: '10',
    r: '11',
    s: '12',
    t: '13',
    u: '14',
    v: '15', // future
    w: '16', // future
}
function letterToAndroidVersion(letter: string): string|undefined {
    return letterAndroidVersionMapping[letter]

}

export class eOS extends Rom {
    name = '/e/ OS'
    logo = ''
    description = ''
    link = ''

    private async getBuild(codename: string, channel: 'dev'|'stable'): Promise<RomBuild> {
        const res = await axios.get(bypassCORS(`https://images.ecloud.global/${channel}/${codename}/`))

        const filename = res.data.match(/href=(e-.*?)>/)?.[1]
        if(!filename) throw new Error('no file found in /e/ OS device page')
        
        const [e, version, androidMajor, date ] = filename.split('-')

        return {
            date: versionToDate(date),
            version: version + '-' + androidMajor,
            state: channel === 'stable' ? RomStability.STABLE : RomStability.BETA,
            androidVersion: letterToAndroidVersion(androidMajor),
            installMethod: InstallationMethod.Recovery,
            files: {
                rom:  {
                    url: `https://images.ecloud.global/${channel}/${codename}/${filename}`,
                    sha256: `https://images.ecloud.global/${channel}/${codename}/${filename}.sha256sum`
                }
            }
        }
    }
    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        const out = [await this.getBuild(codename, 'dev')]
        try {
            out.push(await this.getBuild(codename, 'stable'))
        } catch(err) {}

        return out
    }
}