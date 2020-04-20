"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ansicolor = require("ansicolor");
const pid = process.pid;
exports.MAX_LOG_PREFIX = `  [${pid}  WARN] `.length;
exports.BLANK_PREFIX = ' '.repeat(exports.MAX_LOG_PREFIX);
exports.log = {
    error(message) {
        console.log(`  [${pid} ${ansicolor.lightRed("ERROR")}] ${message}`);
    },
    warn(message) {
        console.log(`  [${pid}  ${ansicolor.yellow("WARN")}] ${message}`);
    },
    info(message) {
        console.log(`  [${pid}  INFO] ${message}`);
    },
    trace(message) {
        console.log(`  [${pid} ${ansicolor.lightMagenta("TRACE")}] ${message}`);
    }
};
//# sourceMappingURL=log.js.map