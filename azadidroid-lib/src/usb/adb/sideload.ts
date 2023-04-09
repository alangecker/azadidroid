import { Adb } from '@yume-chan/adb';

const ADB_EXIT_SUCCESS = 'DONEDONE'

const ADB_EXIT_FAILURE = 'FAILFAIL'
const ADB_SIDELOAD_CHUNK_SIZE = 65536

export async function adbSideload(device: Adb, data: Blob, onProgress: (percentage: number) => void = (_) => {}) {
    const socket = await device.createSocket(`sideload-host:${data.size}:${ADB_SIDELOAD_CHUNK_SIZE}`)
    const reader = socket.readable.getReader()
    const writer = socket.writable.getWriter()

    try {
        let transmittedBytes = 0
        while(true) {
            const res = await reader.read()
            if(res.done) {
                throw new Error('reader unexpectedly ended')
            }
            // TODO: replace with something cross platform compatible
            const resStr = Buffer.from(res.value).toString('ascii')
            if(resStr == ADB_EXIT_SUCCESS) {
                break
            } else if (resStr == ADB_EXIT_FAILURE) {
                throw new Error('sideload failed')
            }
            const requestedBlock = parseInt(resStr)
            const offset = requestedBlock * ADB_SIDELOAD_CHUNK_SIZE;
            if(offset > data.size) {
                throw new Error(`"adb: failed to read block ${requestedBlock} at offset ${offset}, past end ${data.size}`)
            }
    
            const end = Math.min(offset + ADB_SIDELOAD_CHUNK_SIZE, data.size)
            const chunk = data.slice(offset, end)
            await writer.write(new Uint8Array(await chunk.arrayBuffer()))
    
            transmittedBytes += chunk.size
    
            onProgress(transmittedBytes/data.size*100 * 0.99)
        }
    } catch(err) {
        await socket.close().catch(() => {})
        throw err
    }
    await socket.close()
}
