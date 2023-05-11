import romsAvailability from './roms-availability.json' assert { type: "json" };
interface Device {
    code: string
    android: number
    roms: string[]
}

export function getPrefetchedRomAvailability(codename: string): Device|undefined {
    const d = romsAvailability.devices
        .find(d => d.code === codename)
    if(!d) return undefined
    return {
        code: d.code,
        android: d.android,
        roms: d.roms.map(r => r.split(':')[0])
    }
}



