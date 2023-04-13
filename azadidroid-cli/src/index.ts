import './polyfill.js'
import USBPhone from "azadidroid-lib/src/usb/USBPhone.js"
import inquirerImport from 'inquirer';
/**
 * @deprecated TODO: replace with enquirer
 */
const inquirer = inquirerImport
import chalk from 'chalk';
import lang from 'azadidroid-lib/src/langs/en.js'
import PressToContinuePrompt from 'inquirer-press-to-continue';
import { AdbWrapper } from "azadidroid-lib/src/usb/adb/AdbWrapper.js";
import { getModelSummaries } from "azadidroid-lib/src/model/models.js";
import { DeviceMode } from "azadidroid-lib/src/usb/helpers.js";
import { askForOdinModel, chooseFromMultipleModel, confirmModel } from "./prompts/detect.js";
import { pickRom } from "./prompts/roms.js";
import { ModelInfos } from "azadidroid-lib/src/model/index.js";
import { getSteps } from "azadidroid-lib/src/steps/index.js";
import logSymbols from 'log-symbols';
import { Listr, ListrTask } from 'listr2'
import { IDownloadRequest, InstallContext, Step } from "azadidroid-lib/src/steps/base.js";
import { logger, logToConsole, logToTask as logToListrTask, logToTask } from 'azadidroid-lib/src/utils/logger.js'
import { cliHandleStep } from "./steps/handler.js";
import { FileStore } from "./fileStore.js";
import path from "path";


const GITHUB_LINK = '[TODO]' //TODO
import { fileURLToPath } from 'node:url';
import { download } from "azadidroid-lib/src/utils/download.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileStore = new FileStore(path.join(__dirname, '../cache'))

inquirer.registerPrompt('press-to-continue', PressToContinuePrompt);

function printNoDeviceErrror() {
    console.log('\n')
    console.log(chalk.bold(lang.errors.noDevice.message))
    console.log(lang.errors.noDevice.hintsTitle)
    for(let hint of lang.errors.noDevice.hints) {
        console.log(' * '+hint)
    }
    console.log('')
}

function printDeviceInUse() {
    console.log('\n')
    console.log(chalk.bold(lang.errors.deviceInUse.message))
    console.log(lang.errors.deviceInUse.hintsTitle)
    for(let hint of lang.errors.deviceInUse.hints) {
        console.log(' * '+hint)
    }
    console.log('')
}

function printAdbAuthTimeout() {
    // TODO
    console.log('\n')
    console.log(chalk.bold('adb auth timeout'))
    console.log('')
}

function printUSBDevice(device: USBDevice) {
    if(device.serialNumber) console.log('Serial:       '+device.serialNumber)
    console.log('Manufacturer: '+device.manufacturerName)
}

function printAdbDevice(device: AdbWrapper) {
    console.log('Model:        '+device.model)
    console.log('Product:      '+device.product)
}
async function enterToTryAgain() {
    await inquirer.prompt({
        name: 'key',
        type: 'press-to-continue',
        enter: true,
        pressToContinueMessage: 'Press enter to try again...'
    })
}


function printUnsupported(model: ModelInfos) {
    console.log('')
    console.error(chalk.bold(logSymbols.error +' Error: This Model is not supported by the universal-android-installer'))
    console.error(`Installation specifications we don't understand:`)
    for(let feature of model.unsupportedFeatures) {
        console.error(` * ${feature}`)
    }
    
    console.log("\nIf you think, this model should be supported, then feel free to open a issue here:\n"+GITHUB_LINK)
}


async function adbMatchingModels(adb: AdbWrapper) {
    const adbCodename = adb.product
    const model = adb.model.replace(/^(SM|G)-/, '')
    const device = await adb.getProp('ro.product.device')
    const bootDevice = await adb.getProp('ro.boot.device')
    return getModelSummaries()
        .filter(m => 
                m.code == adbCodename ||
                m.code === device ||
                m.code === bootDevice ||
                m.models.map(s => s.replace(/^(SM|G)-/, '')).includes(model) ||
                m.models.map(s => s.replace(/^(SM|G)-/, '')).includes(device) ||
                m.name.endsWith(model) ||

                // sometimes there is one recovery for multiple models
                (adb.isRecovery && m.code.startsWith(adb.productDevice))
        )
}




async function main() {
    const phone = new USBPhone()
    phone.addEventListener('backgroundError', console.log)
    // phone.addEventListener('disconnected', console.log)
    // phone.addEventListener('connected', console.log)
    // phone.addEventListener('reconnected', console.log)
    phone.addEventListener('stateChanged', console.log)
    phone.addEventListener('authSlow', () => {
        console.log(chalk.bold("ADB authentication is still in progress...\nmaybe you need to accept the connection on your phone"))
    })

    // find a device
    while(true) {
        try {
            await phone.requestDevice()
            break
        } catch(err) {
            console.log(err)
            if(err.message?.match(/no devices found|No device selected/)) {
                printNoDeviceErrror()
                await enterToTryAgain()
            } else if(err.message?.match(/LIBUSB_ERROR_BUSY/)) {
                printDeviceInUse()
                await enterToTryAgain()
            } else {
                // TODO: handle other errors (e.g. Access denied)
                throw err
            }
        }
    }

    console.log(chalk.bold('📱 A phone was found'))
    console.log('Mode:         ' + phone.deviceMode)
    printUSBDevice(phone.currentDevice)

    // connect & identify
    let codename = ''
    while(true) {
        switch(phone.deviceMode) {
            case DeviceMode.ADB:
                try {
                    const adb = await phone.getAdb()
                    printAdbDevice(adb)
                    const models = await adbMatchingModels(adb)
                    if(!models.length) {
                        throw new Error(`could not identify phone (model=${adb.model}, product=${adb.product})`)
                    } else if(models.length == 1) {
                        codename = models[0].code
                    } else {
                        codename = await chooseFromMultipleModel(models)
                    }
                } catch(err) {
                    if(err.mesage?.match(/authentication timeout/)) {
                        printAdbAuthTimeout()
                        await enterToTryAgain()
                    } else {
                        throw err
                    }
                }
                break
            case DeviceMode.ODIN:
                // verify connection works
                await phone.getOdin()
                codename = await askForOdinModel()
                break
            case DeviceMode.FASTBOOT:
                const fastboot = await phone.getFastboot()

                // reboot, just to be sure, that bootloader is not stucked in a wired state
                await fastboot.reboot('bootloader', true)

                codename = await fastboot.getVariable('product')
        }
        break
    }


    // confirm device
    // if(!await confirmModel(codename)) {
    //     return
    // }

    // model supported?
    const model = await ModelInfos.get(codename)
    if(!model.isCovered) {
        printUnsupported(model)
        return
    }

    // select rom
    const { rom, version } = await pickRom(codename)    

    const installContext: InstallContext = {
        model: model,
        phone: phone,
        rom: rom,
        versionToInstall: version,
        files: {}
    }

    // generate list of required steps
    const steps = await getSteps(model, rom, version)

    // collect files
    const filesToDownload: IDownloadRequest[] = []
    for(let section in steps) {
        for(let step of steps[section] as Step[]) {
            const files = await step.getFilesToDownload(installContext)
            for(let file of files) {
                filesToDownload.push(file)
            }
        }
    }

    // walk through steps
    function stepToListrTask(step: Step): ListrTask<any> {
        return {
            title: lang.stepTitle[step.key] || step.key,
            task: async (ctx,task) => {
                logToListrTask(task)
                await cliHandleStep(step, task, installContext)
                task.output = ''
            },
            options: {
                bottomBar: Infinity,
                // persistentOutput: true
            },
        } 

    }
    const list = new Listr<any>([
        {
            title: 'Requirements',
            task: (ctx, task) => {
                return task.newListr([
                    ...steps.requirements.map(stepToListrTask),
                ])
            },
        },
        {
            title: 'Download',
            task: (ctx,task) => {
                
                return task.newListr(
                    [
                        ...filesToDownload.map((file): ListrTask => ({
                            title: `${chalk.bold(file.title)} ${file.fileName}`,
                            task: async (ctx, task) => {
                                const initialTitle = task.title
                                const data = await download(file, fileStore, (e) => {
                                    if(e.progress === 1) {
                                        task.title = initialTitle + ' (verifying...)'
                                    } else {
                                        task.title = `${initialTitle} (downloading... ${Math.round(e.progress*100)}%)`
                                    }
                                })
                                installContext.files[file.key] = data
                                task.title = initialTitle + ' (done)'
                            }
                        }),)
                    ],
                    {
                        concurrent: true
                    }
                )
                return new Promise(() => {})
            }
        },
        // {
        //     title: 'Consent to wipe',
        //     async task(ctx, task) {
        //         const res = await task.prompt<boolean>({
        //             type: 'toggle',
        //             message: 'if you continue, all data on the phone will be permanently deleted. Are you sure?'
        //         })
        //         if(!res) throw new Error('user did not consent for deletion')
        //     }
        // },
        {
            title: 'Prepare',
            task: (ctx, task) => task.newListr([
                ...steps.prepare.map(stepToListrTask)
            ])
        },
        {
            title: 'Install',
            task: (ctx, task) => task.newListr([
                ...steps.install.map(stepToListrTask)
            ])
        },
        
    ], {
        rendererOptions: {
            collapseSubtasks: false,
            collapseErrors: false,
        }
    })
    try {
        await list.run()
        console.log('done')
        await phone.close()

        // TODO: node process should exit by itself.
        // there is something still running in the backend...
        process.exit(0)
    } catch(err) {
        logToConsole()
        logger.error(err)
        console.error(err)
        process.exit(1)
    }
}

main()

