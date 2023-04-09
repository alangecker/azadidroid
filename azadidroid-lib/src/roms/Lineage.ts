import { axios, bypassCORS } from '../utils/fetch.js'
import { Rom, RomStability, RomVersion } from './common.js'

export class Lineage extends Rom {
    name = 'LineageOS'
    logo = ''
    description = ''
    link = ''

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get(bypassCORS(`https://download.lineageos.org/api/v1/${codename}/nightly/*`))
        const response = res.data?.response
        if(!response?.length) return []

        const release = response[response.length-1]

        
        return [{
            date: new Date(release.datetime*1000).toISOString().slice(0,10),
            version: release.version,
            url: release.url,
            sha256: release.id,
            state: RomStability.BETA,
        }]
    }
}



// https://github.com/pharuxtan/androidbot/tree/d64984f8bab12f0bee201561c90ec357efbcb167/commands/roms