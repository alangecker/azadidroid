import { axios } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomStability, RomVersion, versionToDate } from './common.js'


export class GrapheneOS extends Rom {
    name = 'GrapheneOS'
    logo = ''
    description = ''
    link = ''

    installVia = InstallationMethod.Fastboot

    async isBootloaderRelockSupported(codename: string) {
        return true
    }

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        const res = await axios.get(`https://releases.grapheneos.org/${codename}-stable`, {
            headers: {
                'Accept-Encoding': 'gzip'
            }
        })
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
