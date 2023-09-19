import { AxiosError } from 'axios'
import { axios } from '../utils/fetch.js'
import { InstallationMethod, Rom, RomStability, RomVersion, versionToDate } from './common.js'


export class GrapheneOS extends Rom {
    name = 'GrapheneOS'
    logo = ''
    description = 'GrapheneOS is designed to provide the highest possible level of security.'
    link = ''

    installVia = InstallationMethod.Fastboot

    getLink(codename: string) {
        return `https://grapheneos.org/install/`
    }

    async isBootloaderRelockSupported(codename: string) {
        return true
    }

    async getAvailableVersions(codename: string): Promise<RomVersion[]> {
        try {
            const res = await axios.get(`https://releases.grapheneos.org/${codename}-stable`, {
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
        } catch(err) {
            if(err instanceof AxiosError && err.code === "ERR_NETWORK") {
                // there is no access-control-allow-origin header on the 404 page
                // so we can't know the response, but we just assume, that the device is not supported
                return []
            }
            throw err
        }
    }
}
