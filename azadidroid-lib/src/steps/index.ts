import { ModelInfos } from "../model/index.js";
import { InstallationMethod, RomVersion } from "../roms/common.js";
import { Rom } from "../roms/index.js";
import { Step } from "./base.js";
import {
    ABCopyPartitionsStep,
    FastbootBootRecoveryStep,
    FastbootFlashZipStep,
    FastbootLockStep,
    FastbootRetrofitDynamicPartitionsStep,
    OdinFlashRecoveryStep,
    RebootOdinToRecoveryStep,
    TWRPFinishStep,
    TWRPInstallROMStep,
    TWRPWipeStep
} from "./flash.js";
import { FastbootUnlockStep, WaitForBootloaderStep } from "./prepare.js";
import { AllowOEMUnlockStep, ConfirmAndroidVersionStep } from "./requirements.js";


export async function getSteps(model: ModelInfos, rom: Rom, romVersion: RomVersion) {
    const steps = {
        requirements: [] as Step[],
        prepare: [] as Step[],
        install: [] as Step[]
    }

    if(model.needsAndroidVersion) {
        steps['requirements'].push(new ConfirmAndroidVersionStep(model.needsAndroidVersion))
    }
    if(model.requiresUnlock) {
        steps['requirements'].push(new AllowOEMUnlockStep)
    }
   
    const installVia = romVersion.installVia || rom.installVia
    if(installVia == InstallationMethod.Recovery) {
        if(model.installMethod == 'heimdall') {
            
            if(model.beforeRecoveryInstall == 'samsung_exynos9xxx' || model.beforeRecoveryInstall == 'samsung_sm7125') {
                // TODO
                // steps['prepare'].push()
            }

            steps['install'].push(new OdinFlashRecoveryStep)
            steps['install'].push(new RebootOdinToRecoveryStep)
        } else if(model.installMethod.startsWith('fastboot')) {
            steps['prepare'].push(new WaitForBootloaderStep)
            steps['prepare'].push(new FastbootUnlockStep)
            // TODO: before_recovery_install_boot_stack            
            steps['install'].push(new FastbootBootRecoveryStep)
        }

        if(model.beforeRomInstall == 'ab_copy_partitions') {
            steps['install'].push(new ABCopyPartitionsStep)
        }

        steps['install'].push(new TWRPWipeStep)

        if(model.installMethod.includes('fastboot') && model.isRetrofitDynamicPartitions) {
            steps['install'].push(new FastbootRetrofitDynamicPartitionsStep)
        }
        steps['install'].push(new TWRPInstallROMStep)
        steps['install'].push(new TWRPFinishStep)
    } else {
        if(model.installMethod == 'heimdall') {
            throw new Error('currently it is only possible to install ROMs via Recovery on Samsung devices')
        }
        steps['prepare'].push(new WaitForBootloaderStep)
        steps['prepare'].push(new FastbootUnlockStep)

        steps['install'].push(new FastbootFlashZipStep)
        
        if(await rom.isBootloaderRelockSupported(model.codename)) {
            steps['install'].push(new FastbootLockStep)
        }
    }

    return steps
}