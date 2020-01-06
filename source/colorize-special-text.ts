import * as ansicolor from 'ansicolor';
export const colorize = {
    file: ansicolor.green,
    symlink: ansicolor.lightBlue,
    directory: ansicolor.cyan,
    scope: ansicolor.yellow,
    package: ansicolor.magenta,
    command: ansicolor.blue,
    error: ansicolor.red,
    template: ansicolor.lightMagenta
};