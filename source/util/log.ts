import ansicolor = require("ansicolor");

export const log = {
    error(message: string) {
        console.log(   ansicolor.red("  [ERROR] " + message));
    },
    warn(message: string) {
        console.log(ansicolor.yellow("[WARNING] " + message));
    },
    info(message: string) {
        console.log("   [INFO] " + message);
    },
    trace(message: string) {
        console.log(ansicolor.magenta("  [TRACE] " + message));
    }
}