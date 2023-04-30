const window = global as any

global.window = window
window.navigator = {
    userAgent: 'NodeJS'
} as null

/**
 * required by fastboot.js
 */
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
