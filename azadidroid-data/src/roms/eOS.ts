import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomAvailability, RomBuild, RomStability, versionToDate } from './common.js'
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
    description = '/e/ OS is a popular fork of Lineage OS, aimed at user friendliness and convenience. It comes with Micro-G installed, which allows the use of Google services.'
    link = ''

    getLink(codename: string) {
        return `https://doc.e.foundation/devices/${codename}/install`
    }

    private async getBuild(codename: string, channel: 'dev'|'stable'): Promise<RomBuild|null> {
        const res = await axios.get(bypassCORS(`https://images.ecloud.global/${channel}/${codename}/`), {
            validateStatus: (status) => [404,200].includes(status)
        })

        if(res.status === 404) {
            return null
        }

        const filename = res.data.match(/href=(e-.*?|IMG-e-.*?)>/)?.[1]
        if(!filename) throw new Error('no file found in /e/ OS device page')
        
        const [e, version, androidMajor, date ] = filename.replace(/^IMG-/, '').split('-')

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
        const devBuild = await this.getBuild(codename, 'dev')
        if(devBuild) return [devBuild]

        const stableBuild = await this.getBuild(codename, 'stable')
        if(stableBuild) return [stableBuild]

        return []
    }
}
