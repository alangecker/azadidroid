
export interface DataStore {
    set<T extends Blob|string>(key: string, value: T): Promise<void>;
    getBlob(key: string): Promise<Blob>;
    getString(key: string): Promise<string>;
}




// const CACHE_DB_NAME = "BlobStore";
// const CACHE_DB_VERSION = 1;

// class IndexedDBStore extends DataStore {
//     db: Promise<IDBDatabase>
//     constructor() {
//         super()
//         this.db = this._wrapReq(
//             indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION),
//             (event) => {
//                 let db = event.target.result;
//                 db.createObjectStore("files", { keyPath: "name" });
//                 /* no index needed for such a small database */
//             }
//         );
//     }
//     private async _wrapReq(request: IDBOpenDBRequest, onUpgrade = null): Promise<any> {
//         return new Promise((resolve, reject) => {
//             request.onsuccess = () => {
//                 resolve(request.result);
//             };
//             // @ts-ignore
//             request.oncomplete = () => {
//                 resolve(request.result);
//             };
//             request.onerror = (event) => {
//                 reject(event);
//             };

//             if (onUpgrade !== null) {
//                 request.onupgradeneeded = onUpgrade;
//             }
//         });
//     }
// }