import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomStability, RomVersion } from './common.js'
import * as yaml from 'js-yaml'


export class CalyxOS extends Rom {
    name = 'CalyxOS'
    logo = ''
    description = ''
    link = ''

    installVia = InstallationMethod.Bootloader

    async isBootloaderRelockSupported(codename: string) {
        return true
    }

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get(`https://gitlab.com/CalyxOS/calyxos.org/-/raw/main/pages/_data/downloads.yml`, {
            headers: {
                'Accept-Encoding': 'gzip'
            }
        })

        const data = yaml.load(res.data) as any

        let release
        let isStable = true
        release = data.stable.find(d => d.codename === codename)
        if(!release) {
            release = data.beta.find(d => d.codename === codename)
            isStable = false
        }
        if(!release) return []
        return [
            {
                date: release.date,
                version: release.version,
                state: isStable ? RomStability.STABLE : RomStability.BETA,
                url: release.factory_link,
                sha256: release.factory_sha256
            }
        ]
    }
}
