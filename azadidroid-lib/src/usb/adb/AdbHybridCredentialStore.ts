// cspell: ignore RSASSA

import { calculateBase64EncodedLength, calculatePublicKey, calculatePublicKeyLength, decodeBase64, decodeUtf8, encodeBase64, type AdbCredentialStore } from "@yume-chan/adb";
import { isBrowser } from "../../utils/platform.js";

const webcrypto = globalThis.crypto

const memoryStore = {}
function storeGet(key: string) {
    if(isBrowser()) {
        return window.localStorage.getItem(key)
    } else {
        return memoryStore[key]
        // TODO: storage in node
        return
    }
}
function storeSet(key: string, value: string) {
    if(isBrowser()) {
        window.localStorage.setItem(key, value)
    } else {
        memoryStore[key] = value
    }
}

async function generateKey() {
    const { privateKey: cryptoKey } = await webcrypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            // 65537
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-1',
        },
        true,
        ['sign', 'verify']
    );

    const privateKey = new Uint8Array(await webcrypto.subtle.exportKey('pkcs8', cryptoKey!));
    return privateKey
}


export default class AdbHybridCredentialStore implements AdbCredentialStore {
    public readonly localStorageKey: string;

    public constructor(localStorageKey = 'private-key') {
        this.localStorageKey = localStorageKey;
    }

    public *iterateKeys(): Generator<Uint8Array, void, void> {
        const privateKey = storeGet(this.localStorageKey);
        if (privateKey) {
            yield decodeBase64(privateKey);
        }
    }

    public async generateKey(): Promise<Uint8Array> {
        const privateKey  = await generateKey()
        storeSet(this.localStorageKey, decodeUtf8(encodeBase64(privateKey)));

        // The authentication module in core doesn't need public keys.
        // It will generate the public key from private key every time.
        // However, maybe there are people want to manually put this public key onto their device,
        // so also save the public key for their convenience.
        const publicKeyLength = calculatePublicKeyLength();
        const [publicKeyBase64Length] = calculateBase64EncodedLength(publicKeyLength);
        const publicKeyBuffer = new Uint8Array(publicKeyBase64Length);
        calculatePublicKey(privateKey, publicKeyBuffer);
        encodeBase64(
            publicKeyBuffer.subarray(0, publicKeyLength),
            publicKeyBuffer
        );
        storeSet(this.localStorageKey + '.pub', decodeUtf8(publicKeyBuffer));

        return privateKey;
    }
}
