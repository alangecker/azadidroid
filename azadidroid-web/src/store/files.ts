
import type { DataStore } from 'azadidroid-lib/src/utils/store.js'

export class FileStore implements DataStore {

  normalizeKey(key: string) {
    return key.replace(/[^a-z0-9\.]+/g, '__')
  }
  async createWriteStream(key: string): Promise<WritableStream> {
    await navigator.storage.persist()
    const rootDir = await navigator.storage.getDirectory()
    const file = await rootDir.getFileHandle(this.normalizeKey(key), { create: true })
    const writeable = await file.createWritable()
    return writeable
  }
  async getFile(key: string): Promise<File> {
    const rootDir = await navigator.storage.getDirectory()
    const fileHandle = await rootDir.getFileHandle(this.normalizeKey(key))
    fileHandle.getFile()
    return fileHandle.getFile()
  }
}



