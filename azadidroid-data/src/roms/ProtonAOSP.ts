import { axiosGetCached } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomBuild, RomStability } from './common.js'

export class ProtonAOSP extends Rom {
    name = 'ProtonAOSP'
    logo = ''
    description = ''
    link = ''

    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        const res = await axiosGetCached('https://protonaosp.org/releases/index.json')

        if(!res.data.latest?.[codename]) return []
        return res.data.latest[codename].map((v): RomBuild => ({
            version: v.version,
            variant: v.variant,
            androidVersion: v.version.split('.')[0],
            installMethod: InstallationMethod.Fastboot,
            state: RomStability.STABLE,
            files: {
                rom: v.url
            }            
        }))
    }
}
