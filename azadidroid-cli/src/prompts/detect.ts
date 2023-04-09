import inquirer from 'inquirer';
import inquirerPrompt from 'inquirer-autocomplete-prompt';
import { getModelSummaries, ModelSummary } from "azadidroid-lib/src/model/models.js"
inquirer.registerPrompt('autocomplete', inquirerPrompt);



function modelLabel(model: ModelSummary) {
    let name = model.name
    let models = model.models.map(model => model.replace(/^(SM|GT)-/, '')).filter(model => !name.includes(model))
    if(models.length) name += ` [${models.join(',')}]`
    if(!name.toLowerCase().includes(model.code)) name += ` [${model.code}]`
   return name
}

export async function askForOdinModel() {
    console.log('')
    console.log("Unfortunately in Samsungs download mode, we can't automatically retrieve the model.")
    console.log('')
    const models = getModelSummaries()
        .filter(m => m.method == 'heimdall')
        .map(m => {
            return {
                code: m.code,
                name: modelLabel(m)
            }
        })
        .sort((a,b) => a.name.localeCompare(b.name))

    function stringSimplify(str: string) {
        return str
            .replace(/III/, '3')
            .replace(/II/, '2')
            .toLowerCase()
            .replace(/ /g, '')
    }
    const answers = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'name',
        message: 'Which model is connected?',
        emptyText: 'Nothing found!',
        source: async (_answers, input = '') => {
            return models.filter(model => 
                stringSimplify(model.name).includes(stringSimplify(input))
            )
        },
        pageSize: 20,
      }
    ])

    // map answer back to codename
    return models.find(m => m.name == answers.name).code
}


export async function confirmModel(codename: string) {
    const modelSummary = getModelSummaries().find(m => m.code === codename)
    console.log('\n')
    console.log(`You have selected following model:`)
    console.log('Vendor:   ' +modelSummary.vendor)
    console.log('Product:  ' +modelSummary.name)
    if(modelSummary.models.length) console.log(`Models: ${modelSummary.models.join(', ')}`)
    console.log('Codename: ' +modelSummary.code)

    const answers = await inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Is this really the correct model? (check the sticker, when unsure)'
    })
    if(!answers.confirm) {
        console.log('start again from scratch')
        return false
    }
    return true
}

export async function chooseFromMultipleModel(models: ModelSummary[]): Promise<string> {
    const options = models.map(m => ({code: m.code, name: m.vendor + ' ' + modelLabel(m)}))
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Multiple models possible. which one do you have?',
        choices: options,
        loop: false
    }
    ])

    // map answer back to codename
    return options.find(o => o.name == answers.model).code
}