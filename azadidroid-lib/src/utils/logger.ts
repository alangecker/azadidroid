import signale from 'signale-logger'
import { WritableStream } from 'node:stream/web';
import { isNode } from './platform.js';
// import type { ListrTaskWrapper } from 'listr2'
type ListrTaskWrapper = any

const consoleStream = new WritableStream({
    write(chunk) {
        console.log(chunk.toString().trim())
    }
})
const defaultWriter = isNode() ? process.stdout : consoleStream.getWriter()

export const logger = new signale.Signale({
    stream: defaultWriter as any,
});

export async function setLogOutput(stream?: WritableStream|NodeJS.WritableStream) {
    if(stream) {
        // @ts-ignore
        logger._stream = stream
    } else {
        // @ts-ignore
        logger._stream = defaultWriter
    }
}



export async function logToTask(task: ListrTaskWrapper) {
    const stream = new WritableStream({
        write(chunk) {
            task.output = chunk
        }
    });
    (logger as any)._stream = stream.getWriter()
}

export async function logToConsole() {
    (logger as any)._stream = defaultWriter
}