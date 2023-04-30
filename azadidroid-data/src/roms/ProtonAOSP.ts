import { axios, bypassCORS } from '../utils/fetch.js'
import { Rom, RomAvailability, RomStability, RomVersion, Version, versionToDate } from './common.js'

export class ProtonAOSP extends Rom {
    name = 'ProtonAOSP'
    logo = ''
    description = ''
    link = ''

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get('https://protonaosp.org/releases/index.json')

        if(!res.data.latest?.[codename]) return []
        return res.data.latest[codename].map((v): RomVersion => ({
            version: v.version,
            url: v.url,
            variant: v.variant,
            state: RomStability.STABLE,
        }))
    }
}
