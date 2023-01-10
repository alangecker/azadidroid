import { ModelInfos } from "../model/index.js";
import { Rom } from "../roms/index.js";
import { InstallContext, Step } from "./base.js";
import { ABCopyPartitionsStep, FastbootRetrofitDynamicPartitionsStep, OdinFlashRecoveryStep, RebootOdinToRecoveryStep, TWRPFinishStep, TWRPInstallROMStep, TWRPWipeStep } from "./flash.js";
import { WaitForBootloaderStep } from "./prepare.js";
import { AllowOEMUnlockStep, ConfirmAndroidVersionStep } from "./requirements.js";


export function getSteps(model: ModelInfos, rom: Rom) {
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
    steps['prepare'].push(new WaitForBootloaderStep)
    
    if(model.installMethod == 'heimdall') {
        
        if(model.beforeRecoveryInstall == 'samsung_exynos9xxx' || model.beforeRecoveryInstall == 'samsung_sm7125') {
            // TODO
            // steps['prepare'].push()
        }

        steps['install'].push(new OdinFlashRecoveryStep)
        steps['install'].push(new RebootOdinToRecoveryStep)
        if(model.beforeRomInstall == 'ab_copy_partitions') {
            steps['install'].push(new ABCopyPartitionsStep)
        }
        steps['install'].push(new TWRPWipeStep)

        if(model.installMethod.includes('fastboot') && model.isRetrofitDynamicPartitions) {
            steps['install'].push(new FastbootRetrofitDynamicPartitionsStep)
        }
        steps['install'].push(new TWRPInstallROMStep)
        steps['install'].push(new TWRPFinishStep)
    } else if(model.installMethod.startsWith('fastboot')) {
        if(rom.installVia == 'recovery') {
            // install ROM via TWRP

        } else {
            // install ROM via fastboot
        }
    }

    return steps
}