import index from './model_index.json' assert { type: "json" };

export interface ModelSummary {
    code: string
    vendor: string
    name: string
    method: string
    models: string[]
}


export function getModelIndex() {
    return index as ModelSummary[]
}