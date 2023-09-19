function isWindow() {
    if (
        typeof document !== "undefined" &&
        typeof document.createElement !== "undefined"
    ) {
        return true;
    }
    return false;
}

export enum Type {
    debug = "debug",
    warn = "warn",
    error = "error",
    success = "success"
};

export interface LogMessage {
    type: Type
    message: string
    data: any[]
    time: Date
}

type WatchCallback = (msg: LogMessage) => void
let listener: WatchCallback|null = null
export function setLogListener(callback: WatchCallback) {
    listener = callback
}
export function removeLogListener() {
    listener = null
}


export const browserTheme = {
    debug: {
        color: "#2e2e2e",
        backgroundColor: "#fff",
        // fontSize: "13px",
    },
    warn: {
        color: "#ffcc00",
        backgroundColor: "#fff",
        // fontSize: "13px",
    },
    error: {
        color: "#cc3300",
        backgroundColor: "#fff",
        // fontSize: "13px",
    },
    success: {
        color: "#339900",
        backgroundColor: "#fff",
        // fontSize: "13px",
    }
};

const nodeTheme = {
    debug: {
        color: "\x1b[30m",
        backgroundColor: "#fff",
    },
    warn: {
        color: "\x1b[33m",
        backgroundColor: "#fff",
    },
    error: {
        color: "\x1b[31m",
        backgroundColor: "#fff",
    },
    success: {
        color: "\x1b[32m",
        backgroundColor: "#fff",
    }
};

export const symbols = {
    debug: "●",
    error: "✖",
    warn: "⚠",
    success: "✔"
};

function camelCaseToDash(str) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
}

function makeStyleOutOfObject(obj) {
    return Object.keys(obj).reduce((acc, curr) => {
        const styles =
            acc +
            `${camelCaseToDash(curr)}:${typeof obj[curr] === "function" ? obj[curr]() : obj[curr]
            }; `;
        return styles;
    }, "");
}

function printBrowserMessage(type: string , message: string, data: any[]) {
    console.log(
        `%c%s %o\n`,
        makeStyleOutOfObject(browserTheme[type]),
        `${symbols[type]} ${message}`,
        ...data
    );
}

function printNodeMessage(type: string, message: string, data: any[]) {
    console.log(
        `${nodeTheme[type].color} %s`,
        `${symbols[type]} ${message}`,
        "\x1b[0m",
        ...data
    );
}
function generateLogger(type: Type) {
    return (message: string, ...data: any[]) => {
        if (isWindow()) {
            printBrowserMessage(Type[type], message, data);
        } else {
            printNodeMessage(Type[type], message, data);
        }
        if(listener) {
            listener({
                type: type,
                message,
                data,
                time: new Date
            })
        }
    }
}

export const logger = {
    debug: generateLogger(Type.debug),
    info: generateLogger(Type.debug),
    log: generateLogger(Type.debug),
    error: generateLogger(Type.error),
    warn: generateLogger(Type.warn),
    success: generateLogger(Type.success),
}