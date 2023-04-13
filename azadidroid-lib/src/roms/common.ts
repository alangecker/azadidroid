
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
    Bootloader = 'bootloader',
}
export abstract class Rom {
    abstract name: string
    abstract logo: string
    abstract description: string
    abstract link: string
    installVia: InstallationMethod = InstallationMethod.Recovery

    async isBootloaderRelockSupported(codename: string): Promise<boolean> { return false }
    abstract getAvailableVersions(codename: string): Promise<RomVersion[]>
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