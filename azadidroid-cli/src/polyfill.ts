const window = global as any

global.window = window
window.navigator = {
    userAgent: 'NodeJS'
} as null

/**
 * required by fastboot.js
 */
window.requestAnimationFrame = (callback: Function) => {
    process.nextTick(callback)
}

import { Blob as NodeBlob } from 'buffer'
window.Blob = NodeBlob

import webcrypto from "@peculiar/webcrypto"
window.crypto = new webcrypto.Crypto


class ProgressEvent extends Event {
    lengthComputable: boolean = false
    loaded: number
    total: number
    constructor(type: string, props?: any) {
        super(type)
        if(props) {
            this.lengthComputable = Boolean(props.lengthComputable);
            this.loaded = Number(props.loaded) || 0;
            this.total = Number(props.total) || 0;
        } 
    }
}
window.ProgressEvent = ProgressEvent


/**
 * sufficient FileReader implementation for zip.js
 */
class FileReader {
    onload: (ev: any) => void
    result: any
    async readAsArrayBuffer(blob: Blob) {
        this.result = await blob.arrayBuffer()
        this.onload({ target: this })
    }
    async readAsText(blob: Blob, encoding = 'utf-8') {
        this.result = await blob.text()
        
        this.onload({ target: this })
    }
}
window.FileReader = FileReader


import Deflate from "@zip.js/zip.js/lib/core/codecs/deflate.js"
import Inflate from "@zip.js/zip.js/lib/core/codecs/inflate.js"

/**
 * Mocked WebWorker for zip.js
 */
class Worker {
    codec: any
    listener: any
    
    terminate() {}

    addEventListener(type: string, callback: any) {
        this.listener = callback
    }
    async postMessage(message: any) {
        const type = message.type;
        if (message.data) {
            message.data = new Uint8Array(message.data);
        }
        
        const response: any = (await this.handle(message)) || {};
        response.type = type;

        if (response.data) {
            response.data = response.data.buffer;
        }
        this.listener({data: response});
    }

    private async handle(message: any) {
        const type = message.type;
        if(type == 'init') {
            return await this.handleInit(message)
        } else if(type == 'append') {
            return { data: await this.codec.append(message.data) }
        } else if(type == 'flush') {
            return this.codec.flush();
        } 
    }
    
    private async handleInit(message: any) {
        // dynamic import to avoid issues with crypto still being undefined
        const { createCodec } = await import("@zip.js/zip.js/lib/core/codecs/codec.js");

        if (message.scripts && message.scripts.length) {
			importScripts.apply(undefined, message.scripts);
		}
		const options = message.options;
		let codecConstructor;
		if (options.codecType.startsWith("deflate")) {
			codecConstructor = Deflate;
		} else if (options.codecType.startsWith("inflate")) {
			codecConstructor = Inflate;
		}
		this.codec = createCodec(codecConstructor, options, message.config);
    }

}
window.Worker = Worker

/**
 * patch out navigator.userAgent use
 */
// import('android-fastboot').then((fastboot) => {
//     fastboot.default.FastbootDevice.prototype.waitForConnect = async function() {
//         return await new Promise((resolve, reject) => {
//             this._connectResolve = resolve;
//             this._connectReject = reject;
//         });
//     }
// })