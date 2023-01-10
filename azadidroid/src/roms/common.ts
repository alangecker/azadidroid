
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
}

export abstract class Rom {
    abstract name: string
    abstract logo: string
    abstract description: string
    abstract link: string
    installVia: 'recovery'|'bootloader' = 'recovery'

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