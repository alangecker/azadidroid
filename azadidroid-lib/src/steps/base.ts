import { ModelInfos } from "azadidroid-data/src/model/ModelInfos.js"
import { Rom, RomBuild } from "azadidroid-data/src/roms/common.js"
import USBPhone from "../usb/USBPhone.js";


export interface IDownloadRequest {
    key: string
    title: string
    url?: string
    fileName: string//|RegExp

    advice?: string
    signatureUrl?: string
    signatureKey?: string
    md5?: string
    sha1?: string
    sha256?: string
    sha512?: string
    
    additionalHeaders?: {[key: string]: string}
}



export interface InstallContext {
    model: ModelInfos
    phone: USBPhone
    rom: Rom
    romBuild: RomBuild
    files: {[key: string]: Blob}
}


type Callback = (a?: any, b?: any) => Promise<any>|any
export class Step {
    constructor(readonly key: string) {}

    // abstract async background(device: Device): Promise<() => void>

    run(context: InstallContext, abortSignal: AbortSignal): Promise<void> {
        return new Promise(() => {})
    }

    async getFilesToDownload(device: InstallContext): Promise<IDownloadRequest[]> {
        return []
    }


    private handler: {[event: string]: Callback} = {}
    on(event: string, callback: Callback) {
        this.handler[event] = callback
    }
    async call(event: string, ...args: any[]): Promise<any> {
        if(this.handler[event]) {
            return await this.handler[event](...args)
        } else {
            throw new Error(`${this.constructor.name} expected a handler for '${event}', but there is non registered`)
        }
    }
}
