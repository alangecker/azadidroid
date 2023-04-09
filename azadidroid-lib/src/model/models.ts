import list from './list.json' assert { type: "json" };

export interface ModelSummary {
    code: string
    vendor: string
    name: string
    method: string
    models: string[]
}


export function getModelSummaries() {
    return list as ModelSummary[]
}