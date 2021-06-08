import * as ansicolor from 'ansicolor';
export const colorize = {
    file: ansicolor.lightGreen,
    symlink: ansicolor.lightBlue,
    directory: ansicolor.cyan,
    scope: ansicolor.yellow,
    package: ansicolor.lightMagenta,
    command: ansicolor.lightBlue,
    error: ansicolor.red,
    template: ansicolor.lightMagenta,
    type: ansicolor.lightCyan,
    badValue: ansicolor.lightRed,
    subfeature: ansicolor.cyan
};