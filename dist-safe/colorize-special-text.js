"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ansicolor = require("ansicolor");
exports.colorize = {
    file: ansicolor.lightGreen,
    symlink: ansicolor.lightBlue,
    directory: ansicolor.cyan,
    scope: ansicolor.yellow,
    package: ansicolor.lightMagenta,
    command: ansicolor.lightBlue,
    error: ansicolor.red,
    template: ansicolor.lightMagenta,
    type: ansicolor.lightCyan,
    badValue: ansicolor.lightRed
};
//# sourceMappingURL=colorize-special-text.js.map