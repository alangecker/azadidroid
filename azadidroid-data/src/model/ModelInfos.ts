import { BeforeInstallDeviceVariant, LineageDeviceData, getLineageWikiDeviceData } from './lineageWiki.js'

type BeforeRecoveryInstall = {
    instructions: 'samsung_exynos9xxx'|'samsung_sm7125'
} | {
    instructions: 'boot_stack',
    partitions: string[]
}

export class ModelInfos {
    private deviceData: LineageDeviceData

    static async get(codename: string): Promise<ModelInfos> {
        return new ModelInfos(await getLineageWikiDeviceData(codename))
    }

    constructor(data: LineageDeviceData) {
        this.deviceData = data
    }
    get vendor() {
        return this.deviceData.vendor
    }
    get name() {
        return this.deviceData.name
    }
    get codename() {
        return this.deviceData.codename
    }
    get models() {
        return this.deviceData?.models || []
    }
    get image() {
        if(!this.deviceData?.image) return null
        return `https://raw.githubusercontent.com/LineageOS/lineage_wiki/master/images/devices/small/${this.deviceData.image}`
    }
    get installMethod(): 'heimdall'|'fastboot_nexus'|'fastboot_xiaomi'|'fastboot_motorola' {
        if(!this.deviceData.install_method) {
            throw new Error(`no 'install_method' specified for ${this.codename}`)
        }

        // is there a reason to separate between them?
        if(this.deviceData.install_method == 'odin') return 'heimdall'

        return this.deviceData.install_method  as any
    }
    get beforeInstallDeviceVariants(): BeforeInstallDeviceVariant[]|null {
        if(!this.deviceData.before_install_device_variants?.length) return null
        return this.deviceData?.before_install_device_variants
    }
    get requiresUnlock() {
        if(this.deviceData.no_oem_unlock_switch) return false
        return true
    }
    get needsAndroidVersion(): string|false {
        if(!this.deviceData.before_install) return false
        if(this.deviceData.before_install.instructions !== 'needs_specific_android_fw') return false
        return this.deviceData.before_install.version
    }
    get beforeRecoveryInstall(): BeforeRecoveryInstall|null {
        if(typeof this.deviceData.before_recovery_install  === 'string') {
            return {
                instructions: this.deviceData.before_recovery_install as any
            }
        } else if (typeof this.deviceData.before_recovery_install === 'object') {
            return this.deviceData.before_recovery_install
        } else  {
            return null
        }
    }

    get beforeRomInstall(): 'ab_copy_partitions'|null {
        if(typeof this.deviceData.before_lineage_install  == 'string') return this.deviceData.before_lineage_install as any
        else return null
    }

    get isRetrofitDynamicPartitions(): boolean {
        return this.deviceData.is_retrofit_dynamic_partitions || false
    }
    get isCovered() {
        return this.unsupportedFeatures.length === 0
    }

    get recoveryCodename() {
        if(this.codename == 'klteactivexx') return 'klte'
        return this.deviceData.custom_recovery_codename || this.codename
    }
    get bootIntoRecoveryInstructions() {
        return this.deviceData.recovery_boot || ''
    }
    get unlockCommand() {
        return this.deviceData.custom_unlock_cmd?.replace(/^fastboot /, '') || 'oem unlock'
    }
    get isQualcommSoc() {
        return this.deviceData.soc?.includes('Qualcomm')
    }
    get isTensorSoc() {
        return this.deviceData.soc?.includes('Google Tensor')
    }
    get recoveryPartitionName() {
        return this.deviceData.recovery_partition_name || 'boot'
    }

    /**
     * @deprecated TODO: move to azadidroid-lib because it should not be required, that azadidroid-data knows about
     * the capabilities of azadidroid-lib
     */
    get unsupportedFeatures() {
        const SUPPORTED = {
            instalMethod: [
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


        let unsupported: string[] = []
        if(!SUPPORTED.instalMethod.includes(this.installMethod)) unsupported.push(this.installMethod)

        if(this.deviceData.required_bootloader) unsupported.push('required_bootloader')

        if(this.deviceData.before_install) {
            if(!SUPPORTED.beforeInstall.includes(this.deviceData.before_install.instructions)) unsupported.push(this.deviceData.before_install.instructions)
        }
        

        if(this.deviceData.before_recovery_install) {
            if(typeof this.deviceData.before_recovery_install == 'string') {
                if(!SUPPORTED.beforeRecoveryInstall.includes(this.deviceData.before_recovery_install)) unsupported.push(this.deviceData.before_recovery_install)
            } else {
                if(!SUPPORTED.beforeRecoveryInstall.includes(this.deviceData.before_recovery_install.instructions)) {
                    unsupported.push(this.deviceData.before_recovery_install.instructions)
                }
            }
        }
        if(this.deviceData.before_lineage_install) {
            if(!SUPPORTED.beforeLineageInstall.includes(this.deviceData.before_lineage_install)) unsupported.push(this.deviceData.before_lineage_install)
        }

        if(typeof this.deviceData.is_unlockable !== 'undefined' && this.deviceData.is_unlockable !== false) {
            unsupported.push('not_unlockable')
        }
        return unsupported
    }
}    

