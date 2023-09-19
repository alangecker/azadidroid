import { IDownloadRequest } from "../steps/base";
import { AxiosProgressEvent, bypassCorsFetch } from 'azadidroid-data/src/utils/fetch'
import { DataStore } from "./store.js";
import { logger } from "./logger.js";


export class DownloadVerificationError extends Error {
    constructor() {
        super('DownloadVerificationError')
    }
}

/**
 * outputs on every chunk the total sum of bytes
 */
export function streamProgress(cb: (totalBytes: number) => void) {
    let totalBytes = 0
    return new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk);
            totalBytes += chunk.byteLength
            cb(totalBytes)
        }
    })
}


async function getCachedOrDownload(
    url: string,
    store:  DataStore,
    onProgress: (event: AxiosProgressEvent) => void,
    abortSignal: AbortSignal,
    additionalHeaders: any
): Promise<File> {
    try {
        const stored = await store.getFile(url)
        if(!stored.size) throw new Error("empty file")
        logger.log(`found chached ${url} (length: ${stored.size}})`)
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
        const cacheKey = url
        if(url.startsWith('https://sourceforge.net/')) {
            url += '/download'
        }
        const u = new URL(url)
        const res = await bypassCorsFetch(url, {
            signal: abortSignal,
            headers: {
                // always add an referer (e.g. required for TWRP download)
                referer: `${u.origin}/`,
                ...additionalHeaders
            }
        })
        const totalBytes = parseInt(res.headers.get("content-length"));
        await res.body
            .pipeThrough(streamProgress((bytes) => {
                onProgress({
                    loaded: bytes,
                    total: totalBytes,
                    progress: bytes/totalBytes,
                    estimated: 0,
                    bytes: 0
                })
            }))
            .pipeTo(await store.createWriteStream(cacheKey))   

        // TODO: calculate and store checksums

        return await store.getFile(cacheKey)
    }
}

export async function download(
    file: IDownloadRequest,
    store:  DataStore,
    onProgress?: (event: AxiosProgressEvent) => void,
    abortSignal?: AbortSignal
): Promise<File> {
    const url = new URL(file.url)
    const p = url.pathname.split('/')
    const filename = p[p.length-1]

    const data = await getCachedOrDownload(
        file.url,
        store,
        onProgress,
        abortSignal,
        file.additionalHeaders
    )
    abortSignal?.throwIfAborted()

    // TODO: verify checksum
    // if(file.sha256) {
    //     let expectedHash = file.sha256
    //     if(!expectedHash.match(/^[0-9a-f]+$/)) {
    //         expectedHash = await getHashFromUrl(file.sha256, filename, file.additionalHeaders)
    //     }
    //     const hash = await calculateHash(data, "SHA-256")
        
    //     if(expectedHash !== hash) throw new DownloadVerificationError
    // }
    
    // if(file.sha512) {
    //     let expectedHash = file.sha512
    //     if(!expectedHash.match(/^[0-9a-f]+$/)) {
    //         expectedHash = await getHashFromUrl(file.sha512, filename, file.additionalHeaders)
    //     }
    //     const hash = await calculateHash(data, "SHA-512")
    //     if(expectedHash !== hash) throw new DownloadVerificationError
    // }
    return data
}
