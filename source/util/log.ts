import ansicolor = require("ansicolor");

const pid = process.pid;

export const MAX_LOG_PREFIX = `[${pid} ${ansicolor.yellow("WARNING")}] `.length;

export const log = {
    error(message: string) {
        console.log(`  [${pid} ${ansicolor.lightRed("ERROR")}] ${message}`);
    },
    warn(message: string) {
        console.log(`[${pid} ${ansicolor.yellow("WARNING")}] ${message}`);
    },
    info(message: string) {
        console.log(`   [${pid} INFO] ${message}`);
    },
    trace(message: string) {
        console.log(`  [${pid} ${ansicolor.lightMagenta("TRACE")}] ${message}`);
    }
}