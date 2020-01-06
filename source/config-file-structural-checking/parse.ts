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

/**
 * // validate the json
    var configFileJSON: TSMonorepoJson | undefined;
    try {
        configFileJSON = validateConfigFile(parsedJson);
    } catch(e) {
        const error: Error = e;
        const tempCharStart = "→";
        function escapeRegExp(str: string) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        }
        error.name = `invalid ${colorize.file(CONFIG_FILE_NAME)} structure`;
        function validationErrorFix(input: string) {
            const lines = (input
                .replace(new RegExp(`${escapeRegExp(error.name)}: `, "g"), "") // remove error name from beginning of message
                .replace(/TSMonorepoJson/g, "\n" + tempCharStart + colorize.file(CONFIG_FILE_NAME)) // replace the type name of the validating TS interface with a temp char start
                .trimStart())
                .split("\n");
            var i = 0;
            for(const line of lines) {
                if (!line.startsWith(tempCharStart)) {
                    break;
                }
                i++
            }
            return "\n" + lines.slice(0, i)
                .join("\n")
                .replace(/, \n/g, "\n\n") 
                .replace(new RegExp(tempCharStart, 'g'), " " + ansicolor.magenta("subject: "))
                .replace(/ should/g, "\n   " + ansicolor.red("error:") + " should");
        }
        error.message = validationErrorFix(error.message);
        error.stack = undefined;
        return left([{
            type: ErrorType.InvalidConfig,
            message: `${error.name}\n${error.message}`
        }]);
    }
    if (configFileJSON === undefined) {
        return left([{
            type: ErrorType.UndefinedConfig,
            message: `After parsing, the config file ${colorize.file(CONFIG_FILE_NAME)} is undefined`
        }]);
    }
    return right(configFileJSON);
 */