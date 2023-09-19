import { ModelSummary, getModelIndex } from "azadidroid-data/src/model/models.js"
import { AdbWrapper } from "./AdbWrapper.js"

export async function adbIdentifyPossibleModels(adb: AdbWrapper): Promise<ModelSummary[]> {
    const adbCodename = adb.product
    const model = adb.model.replace(/^(SM|G)-/, '')
    const device = await adb.getProp('ro.product.device')
    const bootDevice = await adb.getProp('ro.boot.device')
    return getModelIndex()
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
