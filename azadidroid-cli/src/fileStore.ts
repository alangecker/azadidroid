
import fs from 'node:fs/promises'
import * as path from 'node:path'
import type { DataStore } from 'azadidroid-lib/src/utils/store.js'
import './polyfill.js'

export class FileStore implements DataStore {
    constructor(readonly root: string) {}
    private getFilePath(key: string) {
        const filename = key.replace(/[ &\/\\#,+()$~%'":*?<>{}]/g, "_")
        return path.join(this.root, filename)
    }
    async set<T extends Blob|string>(key: string, value: T) {
        if(typeof value === 'string') {
            await fs.writeFile(this.getFilePath(key), value, 'utf8')
        } else {
            // TODO: reduce memory requirement (e.g. by writing chunk by chunk)
            const buf = await value.arrayBuffer()
            await fs.writeFile(this.getFilePath(key), new DataView(buf))
        }
    }
    async getBlob(key: string): Promise<Blob> {
        const file = await fs.readFile(this.getFilePath(key))
        return new Blob([file])
    }
    async getString(key: string): Promise<string> {
        return await fs.readFile(this.getFilePath(key), 'utf8')
    }
}
