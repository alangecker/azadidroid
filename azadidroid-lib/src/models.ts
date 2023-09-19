export { getModelIndex, type ModelSummary } from 'azadidroid-data/src/model/models.js'
export { ModelInfos } from 'azadidroid-data/src/model/ModelInfos.js'
import { ModelInfos } from 'azadidroid-data/src/model/ModelInfos.js'


const SUPPORTED = {
    installMethod: [
        'heimdall',
        'fastboot_nexus',
        'fastboot_xiaomi',
        'fastboot_motorola',
    ],
    beforeInstall: [
        'needs_specific_android_fw'
    ],
    beforeRecoveryInstall: [
        'boot_stack',
        
        // 'samsung_exynos9xxx',
        // 'samsung_sm7125',
    ],
    beforeLineageInstall: [
        // 'ab_copy_partitions'
    ]
}


export function getUnsupportedFeatures(model: ModelInfos): string[] {
    let unsupported: string[] = []
    if(!SUPPORTED.installMethod.includes(model.installMethod)) unsupported.push(model.installMethod)
    if(model.lineageWikiDeviceData.required_bootloader) unsupported.push('required_bootloader')

    if(model.lineageWikiDeviceData.firmware_update) unsupported.push('firmware_update')

    if(model.lineageWikiDeviceData.before_install) {
        if(!SUPPORTED.beforeInstall.includes(model.lineageWikiDeviceData.before_install.instructions)) unsupported.push(model.lineageWikiDeviceData.before_install.instructions)
    }
    

    if(model.beforeRecoveryInstall) {
        if(!SUPPORTED.beforeRecoveryInstall.includes(model.beforeRecoveryInstall.instructions)) {
            unsupported.push(model.beforeRecoveryInstall.instructions)
        }
    }
    if(model.lineageWikiDeviceData.before_lineage_install) {
        if(!SUPPORTED.beforeLineageInstall.includes(model.lineageWikiDeviceData.before_lineage_install)) unsupported.push(model.lineageWikiDeviceData.before_lineage_install)
    }

    if(typeof model.lineageWikiDeviceData.is_unlockable !== 'undefined' && model.lineageWikiDeviceData.is_unlockable !== false) {
        unsupported.push('not_unlockable')
    }
    return unsupported
}