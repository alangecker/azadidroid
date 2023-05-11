// import type { Axios } from 'axios'
import { isNode } from './platform.js'

import axios, { AxiosResponse } from 'axios'
export { default as axios } from 'axios'

const ENV = (import.meta as any).env
const CORS_BYPASS_PROXY = 
    ENV?.['VITE_CORS_PROXY'] || 
    ENV?.['AZADIDROID_CORS_PROXY'] ||
    'https://azadidroid.app/cors-bypass/'

    export function bypassCORS(url: string) {
    if(isNode()) {
        // CORS is not relevant here
        return url
    } else {
        const u = new URL(url)
        return CORS_BYPASS_PROXY + u.hostname + u.pathname + u.search
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
