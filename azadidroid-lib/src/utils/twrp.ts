import { bypassCorsFetch } from "../utils/fetch.js"
import { InstallContext, IDownloadRequest } from "./base.js"

// TODO: cache requests
export async function getRecoveryFile(ctx: InstallContext): Promise<IDownloadRequest> {
    const codename = ctx.model.recoveryCodename
    try {
        const res = await bypassCorsFetch(`https://dl.twrp.me/${codename}/`)
        const version = (await res.text()).match(/">(twrp-(.*?).img)<\/a>/)
        let filename = version[1]
    
        if(codename === 'herolte' && filename === 'twrp-3.7.0_9-0-herolte.img') {
            // this version is known to be broken, no fix yet available
            // https://forum.xda-developers.com/t/recovery-exynos-official-twrp-for-galaxy-s7-herolte.3333770/post-87650111
    
            // rather use the last known good version
            filename = 'twrp-3.6.2_9-0-herolte.img'
        }
    
        return {
            key: "recovery",
            title: "Recovery (TWRP)",
            fileName: filename,
            url: `https://dl.twrp.me/${codename}/${filename}`,
            sha256: `https://dl.twrp.me/${codename}/${filename}.sha256`,
            additionalHeaders: {
                'Referer': 'https://dl.twrp.me/'
            }
        }
    } catch(err) {
        throw new Error(`could not find TWRP recovery for ${codename}`)
    }
}
