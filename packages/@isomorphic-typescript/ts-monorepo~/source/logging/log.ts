import { identity } from 'io-ts';
import * as ansicolor from 'ansicolor';

function getLogPrefix(colorTransformer: (logType: string) => string, logType: string) {
    return `[${ansicolor.dim("TSMR")}${logType.padStart(6).split(logType).join(colorTransformer(logType))}]`;
}

export const log = {
    error(...subjects: any[]) {
        console.log(getLogPrefix(ansicolor.lightRed, "ERROR"), ...subjects);
    },
    warn(...subjects: any[]) {
        console.log(getLogPrefix(ansicolor.yellow, "WARN"), ...subjects);
    },
    info(...subjects: any[]) {
        console.log(getLogPrefix(identity, "INFO"), ...subjects);
    },
    trace(...subjects: any[]) {
        console.log(getLogPrefix(ansicolor.lightMagenta, "TRACE"), ...subjects);
    }
}