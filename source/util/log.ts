import ansicolor = require("ansicolor");

const pid = process.pid;

export const log = {
    error(message: string) {
        console.log(`  [${pid} ${ansicolor.red("ERROR")}] ${message}`);
    },
    warn(message: string) {
        console.log(`[${pid} ${ansicolor.yellow("WARNING")}] ${message}`);
    },
    info(message: string) {
        console.log(`   [${pid} INFO] ${message}`);
    },
    trace(message: string) {
        console.log(`  [${pid} ${ansicolor.magenta("TRACE")}] ${message}`);
    }
}