// import type { Axios } from 'axios'
import { isBrowser, isNode } from './platform.js'

import Axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
export type { AxiosProgressEvent } from 'axios'

const ENV = (import.meta as any).env
const CORS_BYPASS_PROXY = 
    ENV?.['VITE_CORS_PROXY'] || 
    ENV?.['AZADIDROID_CORS_PROXY'] ||
    'https://cors-bypass.azadidroid.app/'

export async function bypassCorsFetch(url: string, options?: RequestInit) {
    if(!isBrowser()) {
        // no CORS bypass required
        return fetch(url, options)
    } else {
        const u = new URL(url)
        const newUrl = CORS_BYPASS_PROXY + u.hostname + u.pathname + u.search

        if(options?.headers) {
            // some browsers don't allow to modify following headers
            // we pass them prefixed (X-) to the CORS-Proxy which then
            // rewrites them
            const blockedHeaders = ['referer', 'user-agent', 'accept-encoding']
            for(let h of blockedHeaders) {
                for(let key in options.headers)  {
                    if(key.toLowerCase() === h) {
                        options.headers['x-'+key] = options.headers[key]
                        delete options.headers[key]
                    }
                }
            }
        }
        return fetch(newUrl, options)
    }
}

/**
 * @deprecated use bypassCorsFetch()
 */
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

export const axios = {
    /**
     * @deprecated use bypassCorsFetch
     */
    get(url: string, config?: AxiosRequestConfig) {
        if(url.startsWith(CORS_BYPASS_PROXY) && config?.headers) {
            // some browsers don't allow to modify following headers
            // we pass them prefixed (X-) to the CORS-Proxy which then
            // rewrites them
            const blockedHeaders = ['referer', 'user-agent', 'accept-encoding']
            for(let h of blockedHeaders) {
                for(let key in config.headers)  {
                    if(key.toLowerCase() === h) {
                        config.headers['x-'+key] = config.headers[key]
                        delete config.headers[key]
                    }
                }
            }
            return Axios.get(url, config)
        } else {
            return Axios.get(url, config)
        }
    }
}
