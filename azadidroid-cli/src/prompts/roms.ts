import inquirer from 'inquirer';
import chalk from 'chalk';
import { getAvailableRoms, Rom, RomVersion } from "azadidroid-lib/src/roms.js";
import ora from 'ora';
import logSymbols from 'log-symbols';

export async function pickRom(codename: string) {
    console.log('Retrieving available roms')
    const spinner = ora('Retrieving available roms...').start()
    const roms = getAvailableRoms(codename)
    await Promise.all(roms.map(r => r.versions))
    spinner.succeed()

    let options: Array<{rom: Rom, version: RomVersion, label: string}> = []
    for(let r of roms) {
        const versions = await r.versions
        let str = ' * ' + chalk.bold(r.rom.name) + ' '.repeat(r.rom.name.length > 13 ? 0 : 13 - r.rom.name.length)
        if(versions.length) {
            str += logSymbols.success + ' available'
        } else {
            str += logSymbols.error + ' not available'
        }
        console.log(str)
        for(let v of versions) {
            options.push({
                rom: r.rom,
                version: v,
                label: `${r.rom.name}${v.variant ? ` (${v.variant})` : ''} ${v.version} [${v.date ? v.date+'/' : ''}${v.state}]`
            })
        }
    }
    console.log('')
    console.log('')

    const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'rom',
          message: 'Which ROM should be installed?',
          choices: options.map(o => o.label),
          loop: false
      }
    ])

    const { rom, version } = options.find(o => o.label === answers.rom)
    return { rom, version }
}