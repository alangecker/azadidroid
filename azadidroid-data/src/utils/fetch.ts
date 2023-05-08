// import type { Axios } from 'axios'
import { isNode } from './platform.js'

import axios, { AxiosResponse } from 'axios'
export { default as axios } from 'axios'

export function bypassCORS(url: string) {
    if(isNode()) {
        // CORS is not relevant here
        return url
    } else {
        throw new Error('A proxy for bypassing CORS is not implemented yet')
    }
}

const cache: {[url: string]: Promise<AxiosResponse>} = {}
export function axiosGetCached(url: string, options?: any) {
    const cacheKey = url+(options ? JSON.stringify(options) : '')
    if(!cache[cacheKey]) {
        cache[cacheKey] =  axios.get(url)
    }
    return cache[cacheKey]
}