import { identity } from 'io-ts';
import * as ansicolor from 'ansicolor';

const pid = process.pid;

function getLogPrefix(colorTransformer: (logType: string) => string, logType: string) {
    return `[${ansicolor.dim("TSMR")}${ansicolor.darkGray(new String(pid).padEnd(6))}${colorTransformer(logType)}]`;
}

export const log = {
    error(...subjects: any[]) {
        console.log(getLogPrefix(ansicolor.lightRed, "E"), ...subjects);
    },
    warn(...subjects: any[]) {
        console.log(getLogPrefix(ansicolor.yellow, "W"), ...subjects);
    },
    info(...subjects: any[]) {
        console.log(getLogPrefix(identity, "I"), ...subjects);
    },
    trace(...subjects: any[]) {
        console.log(getLogPrefix(ansicolor.lightMagenta, "T"), ...subjects);
    }
}