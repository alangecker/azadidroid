import { axios, bypassCORS } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomStability, RomVersion, versionToDate } from './common.js'


export class GrapheneOS extends Rom {
    name = 'GrapheneOS'
    logo = ''
    description = ''
    link = ''

    installVia = InstallationMethod.Fastboot

    getLink(codename: string) {
        return `https://grapheneos.org/install/`
    }

    async isBootloaderRelockSupported(codename: string) {
        return true
    }

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get(bypassCORS(`https://releases.grapheneos.org/${codename}-stable`), {
            headers: {
                'Accept-Encoding': 'gzip'
            },
            validateStatus: (status) => status === 200 || status === 404 || status === 410
        })
        if(res.status === 404 || res.status === 410) {
            return []
        }
        const release = res.data.split(' ')[0]
        return [
            {
                date: versionToDate(release),
                version: release,
                state: RomStability.STABLE,
                url: `https://releases.grapheneos.org/${codename}-factory-${release}.zip`,
                // signature: `https://releases.grapheneos.org/${codename}-factory-${release}.zip.sig`
            }
        ]
    }
}
