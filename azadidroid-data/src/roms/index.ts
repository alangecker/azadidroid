import { Lineage } from "./Lineage.js";
import { Rom, RomVersion } from './common.js'
import { CalyxOS } from "./CalyxOS.js";
import { DivestOS } from "./DivestOS.js";
import { GrapheneOS } from "./GrapheneOS.js";
import { eOS } from "./eOS.js";
import { ProtonAOSP } from "./ProtonAOSP.js";
import { IodeOS } from "./IodeOS.js";
import { crDroid } from "./crDroid.js";
export { Rom, Version } from './common.js'

export const roms: {[name: string]: Rom} = {
    lineage: new Lineage(),
    calyxos: new CalyxOS(),
    divestos: new DivestOS(),
    grapheneos: new GrapheneOS(),
    eos: new eOS(),
    protonaosp: new ProtonAOSP(),
    iode: new IodeOS(),
    crdoid: new crDroid(),
}
