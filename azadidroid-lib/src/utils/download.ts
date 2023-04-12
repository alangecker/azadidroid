import { IDownloadRequest } from "../steps/base";
import axios, { AxiosProgressEvent } from 'axios'
import { isBrowser, isNode } from "./platform.js";
import jsSHA from 'jssha'
import { bypassCORS } from "./fetch.js";
import { DataStore } from "./store.js";
import { logger } from "./logger.js";



type HashType = "SHA-1" | "SHA-224" | "SHA-256" | "SHA-384" | "SHA-512" | "SHA3-224" | "SHA3-256" | "SHA3-384" | "SHA3-512";

async function calculateHash(blob: Blob, type: HashType) {
    const shaObj = new jsSHA(type, "ARRAYBUFFER");
    const chunkSize = 1024*1024
    for(let i=0; i<blob.size; i += chunkSize) {
        const slice = await blob.slice(i, i + chunkSize).arrayBuffer()
        shaObj.update(slice)
    }
    return shaObj.getHash("HEX");
}

export class DownloadVerificationError extends Error {
    constructor() {
        super('DownloadVerificationError')
    }
}

async function getHashFromUrl(url: string, filename: string, additionalHeaders: any) {
    const res = await axios(url, {
        headers: additionalHeaders,
    })
    const line = res.data.split('\n').find(line => line.includes(filename))
    return line.split(' ')[0]
}

async function getCachedOrDownload(
    url: string,
    store:  DataStore,
    onProgress: (event: AxiosProgressEvent) => void,
    abortSignal: AbortSignal,
    additionalHeaders: any
): Promise<Blob> {
    try {
        const stored = await store.getBlob('file__'+url)
        logger.log("found cached: "+url)
        abortSignal?.throwIfAborted()
        if(onProgress) onProgress({
            loaded: stored.size,
            total: stored.size,
            progress: 1,
            estimated: 0,
            bytes: stored.size
        })
        return stored
    } catch(_) {
        logger.log("downloading "+url)
        const res = await axios(bypassCORS(url), {
            headers: Object.assign(
                {
                    // let lineage mirrorbits redirect instead of responding with a JSON
                    'Accept': ''
                },
                additionalHeaders
            ),
            onDownloadProgress: onProgress,
            signal: abortSignal,
            responseType: isBrowser() ? 'blob' : 'arraybuffer',
        })
        abortSignal?.throwIfAborted()
        
        // for consistent handling with node we still convert the response to an blob
        if(!(res.data instanceof Blob)) res.data = new Blob([res.data])

        await store.set('file__'+url, res.data)
        return res.data
    }
}

export async function download(
    file: IDownloadRequest,
    store:  DataStore,
    onProgress?: (event: AxiosProgressEvent) => void,
    abortSignal?: AbortSignal
): Promise<Blob> {
    const url = new URL(file.url)
    const p = url.pathname.split('/')
    const filename = p[p.length-1]

    const data = await getCachedOrDownload(
        file.url,
        store,
        onProgress,abortSignal,
        file.additionalHeaders
    )
    abortSignal?.throwIfAborted()

        
    
    return data
}


// import { fileURLToPath } from 'node:url';
// import path from "node:path";
// import { FileStore } from "../cli/fileStore.js";
// import { DataStore } from "./store.js";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const fileStore = new FileStore('/tmp/')
// const x = new AbortController
// x.signal

// download({
//     key: 'recovery',
//     title: 'Recovery (TWRP)',
//     fileName: 'twrp-3.7.0_9-0-klte.img',
//     url: 'https://dl.twrp.me/klte/twrp-3.7.0_9-0-klte.img',
//     sha256: 'https://dl.twrp.me/klte/twrp-3.7.0_9-0-klte.img.sha256',
//     additionalHeaders: { Referer: 'https://dl.twrp.me/' }
// }, fileStore, console.log, x.signal)

// {
//     key: 'recovery',
//     title: 'Recovery (TWRP)',
//     fileName: 'twrp-3.7.0_9-0-klte.img',
//     url: 'https://dl.twrp.me/klte/twrp-3.7.0_9-0-klte.img',
//     sha256: 'https://dl.twrp.me/klte/twrp-3.7.0_9-0-klte.img.sha256',
//     additionalHeaders: { Referer: 'https://dl.twrp.me/' }
//   },
//   {
//     key: 'rom',
//     title: 'LineageOS',
//     fileName: 'lineage-18.1-20221214-nightly-klteactivexx-signed.zip',
//     url: 'https://mirrorbits.lineageos.org/full/klteactivexx/20221214/lineage-18.1-20221214-nightly-klteactivexx-signed.zip',
//     sha256: 'c3a4b9dcdcbe09ea69b5ad7febcf40f58b2a3a10165557fe5e0af620441cbf79',
//     sha512: undefined
//   }
