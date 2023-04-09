
import { ListrTaskWrapper } from 'listr2'
import type { InstallContext, Step } from 'azadidroid-lib/src/steps/base.js'
import { RebootOdinToRecoveryStep, TWRPInstallROMStep } from 'azadidroid-lib/src/steps/flash.js'
import { AllowOEMUnlockStep, AndroidVersionInvalidError, ConfirmAndroidVersionStep } from 'azadidroid-lib/src/steps/requirements.js'
import { FastbootUnlockStep } from 'azadidroid-lib/src/steps/prepare.js'
import chalk from 'chalk'

type Handler = {
    step: typeof Step,
    register: (step: Step, task: ListrTaskWrapper<any, any>, ctx: InstallContext) => void,
    onError?: (err: Error, step: Step) => void
}


const handlers: Handler[] = [
        {
            step: ConfirmAndroidVersionStep,
            register(step: ConfirmAndroidVersionStep, task, ctx) {
                step.on('manualConfirm', async () => {
                    task.output = `That everything works as expected, it is required that a specific Version of Android from the Vendor was installed`
                    const res = await task.prompt<boolean>({
                        type: 'Toggle',
                        message: 'Are you sure that the last Android version installed was ' + step.neededVersion
                    })
                    if(!res) throw new AndroidVersionInvalidError(step.neededVersion)
                })
            },
            onError(err) {
                if(err instanceof AndroidVersionInvalidError) {
                    err.message =`You don't have the required official android version installed. Please install version ${err.requiredVersion}. You can find tutorials for your model on the internet`
                }
            }
        },
        {
            step: AllowOEMUnlockStep,
            register(step, task, ctx) {
                step.on('manualEnableOEMUnlock', () => {
                    task.output = chalk.bold('Interaction required:')+' Toggle the OEM-Unlock switch and wait'
                })
            }
        },
        {
            step: FastbootUnlockStep,
            register(step, task, ctx) {
                step.on('confirmUnlock', () => {
                    task.output = 'At this point the device may display on-screen prompts which will require interaction to continue the process of unlocking the bootloader. Please take whatever actions the device asks you to to proceed.'
                })
            }
        },
        {
            step: RebootOdinToRecoveryStep,
            register(step, task, ctx) {
                task.output = chalk.bold('You have to manually reboot into recovery:')
                    + "\n * Turn off your device (I know, it is probably advicing you against that, but it's really okay!)"
                    + "\n * "+ctx.model.bootIntoRecoveryInstructions?.replace(/<kbd>(.*?)<\/kbd>/g, (_,m) => chalk.underline(m))
                    + "\n"
                task.output = "If you device is in recovery but still doesn't show up, try unplugging and replugging the USB cable"
            }
        },
        {
            step: TWRPInstallROMStep,
            register(step, task, ctx) {
                const initialTitle = task.title
                step.on('progress', (percentage) => {
                    task.title = `${initialTitle} (${Math.round(percentage)}%)`
                })
            }
        }
]

export async function cliHandleStep(step: Step, task: ListrTaskWrapper<any, any>, ctx: InstallContext) {
    
    // the abort signal is not really used in the CLI, but required for the web ui
    const abort = new AbortController()

    const handler = handlers.find((handler) => step instanceof handler.step)
    
    if(handler?.register)  {
        handler.register(step, task, ctx)
    }
    try {
        await step.run(ctx, abort.signal)
    } catch(err) {
        if(handler?.onError) handler.onError(err, step)
        throw err
    }
}