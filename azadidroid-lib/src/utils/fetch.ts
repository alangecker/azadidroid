// import type { Axios } from 'axios'
import { isNode } from './platform.js'

export { default as axios } from 'axios'

export function bypassCORS(url: string) {
    if(isNode()) {
        // CORS is not relevant here
        return url
    } else {
        throw new Error('A proxy for bypassing CORS is not implemented yet')
    }
}

