import { InstallationMethod, Rom, RomBuild, RomStability, getGitlabFile } from './common.js'
import * as yaml from 'js-yaml'

/**
 * this assumes, that CalyxOS increases its major version with every major android version
 */
function calyxToAndroidVersion(version: string) {
    const v = version.split('.').map(a => parseInt(a))
    if(v[0] === 3 && v[1] >= 3) return '12L'
    let androidVersion = (v[0] + 9).toString()
    return androidVersion
}
export class CalyxOS extends Rom {
    name = 'CalyxOS'
    logo = ''
    description = ''
    link = ''

    installVia = InstallationMethod.Fastboot

    async isBootloaderRelockSupported(codename: string) {
        return true
    }

    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        // https://gitlab.com/CalyxOS/calyxos.org/-/raw/main/pages/_data/downloads.yml
        const res = await getGitlabFile(19199746, 'main', 'pages/_data/downloads.yml')

        const data = yaml.load(res) as any

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
                androidVersion: calyxToAndroidVersion(release.version),
                state: isStable ? RomStability.STABLE : RomStability.BETA,
                installMethod: InstallationMethod.Fastboot,
                files: {
                    rom: {
                        url: release.factory_link,
                        sha256: release.factory_sha256,
                    }
                }
            }
        ]
    }
}
