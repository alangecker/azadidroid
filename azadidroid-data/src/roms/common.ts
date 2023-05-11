import { axios, axiosGetCached } from "../utils/fetch"

export enum RomStability {
    STABLE = 'stable',
    BETA = 'beta', // Likely Working
    UNTESTED = 'untested'
}

type RomUnavailable = { isAvailable: false }
export type RomAvailability = RomUnavailable | {
    isAvailable: true
    state: RomStability
    version: string
    date: string
}

export type RomFile = {
    url: string
    sha256?: string
    sha512?: string
}

export type RomBuild = {
    state: RomStability
    version: string
    androidVersion?: string
    variant?: string
    date?: string
    installMethod: InstallationMethod
    files: {[key: string]: RomFile}
}

/**
 * @deprecated replaced with RomBuild
 */
export type RomVersion = {
    state: RomStability
    version: string
    variant?: string
    url: string
    date?: string
    sha256?: string
    sha512?: string
    installVia?: InstallationMethod
}


export enum InstallationMethod  {
    Recovery = 'recovery',
    Fastboot = 'fastboot',
    /**
     * @deprecated rather use InstallationMethod.Fastboot
     */
    Bootloader = 'bootloader',
}
export abstract class Rom {
    abstract name: string
    abstract logo: string
    abstract description: string
    abstract link: string
    installVia: InstallationMethod = InstallationMethod.Recovery

    async isBootloaderRelockSupported(codename: string): Promise<boolean> { return false }
    /**
     * @deprecated use getAvailableBuilds()
     */
    async getAvailableVersions(codename: string): Promise<RomVersion[]> { return [] }
    async getAvailableBuilds(codename: string): Promise<RomBuild[]> {
        // wrapping deprecated getAvailableVersions() for backwards compatibility
        return (await this.getAvailableVersions(codename)).map(v => {
            return {
                state: v.state,
                version: v.version,
                variant: v.variant,
                date: v.date,
                installMethod: this.installVia,
                files: {
                    rom: {
                        url: v.url,
                        sha256: v.sha256,
                        sha512: v.sha512
                    }
                }
            }
        })
    }
}

export interface Version {
    filename: string
    version: string
    url: string
}

export function versionToDate(str: string) {
    return [
        str.slice(0,4),  // Y
        str.slice(4,6),  // M
        str.slice(6,8)   // D
    ].join('-')
}

const knownLineageVersionMapping = {
    '16.0': '9.0',
    '17.1': '10',
    '18.1': '11',
    '19.1': '12.1',
    '20': '13',
}
export function lineageToAndroidVersion(version: string) {
    if(knownLineageVersionMapping[version]) return knownLineageVersionMapping[version]

    const v = version.split('.')
    if(knownLineageVersionMapping[v[0]]) return knownLineageVersionMapping[v[0]]

    const majorLineageVersion = parseInt(v[0])

    return (majorLineageVersion - 7).toString()
}

export async function getGitlabFile(projectId: number, branch: string, path: string) {
    const res = await axiosGetCached(`https://gitlab.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, {
        headers: {
            'Accept-Encoding': 'gzip'
        }
    })

    if(typeof atob === 'function') {
        return atob(res.data.content)
    } else if(typeof Buffer !== 'undefined') {
        return Buffer.from(res.data.content, 'base64').toString('utf-8')
    } else {
        throw new Error('could not decode base64. neither atob() nor Buffer() found')
    }
}