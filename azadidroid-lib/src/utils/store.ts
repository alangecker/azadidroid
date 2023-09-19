
export interface DataStore {
    createWriteStream(key: string): Promise<WritableStream>
    getFile(key: string): Promise<File>
}
