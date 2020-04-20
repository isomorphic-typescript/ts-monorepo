import { parse } from 'comment-json';
import * as ansicolor from 'ansicolor';
import { CONFIG_FILE_NAME } from '../common/constants';
import { ConfigError, ErrorType } from '../common/errors';
import { colorize } from '../colorize-special-text';
import * as either from 'fp-ts/lib/Either';

export function parseJson(json: string): either.Either<ConfigError[], Object> {
    try {
        return either.right(parse(json, undefined, true) as Object);
    } catch(e) {
        if (e.name === "SyntaxError") {
            e.message = `\n ${ansicolor.magenta('subject:')} ${ansicolor.green(CONFIG_FILE_NAME)}${
                "\n"
            }   ${ansicolor.red("error")}: ${e.message} on line ${ansicolor.green(e.line)}, column ${ansicolor.green(""+(e.column+1))}`;
            e.stack = undefined;
        }
        e.name = `${colorize.file(CONFIG_FILE_NAME)} parse error from library ${ansicolor.cyan("comment-json")}`;
        return either.left([{
            type: ErrorType.JsonParseError,
            message: `${e.name}\n${e.message}`
        }]);
    }
}