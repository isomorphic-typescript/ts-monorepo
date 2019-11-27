import { parse } from 'comment-json';
import validateConfigFile, { TSMonorepoJson } from './config.validator';
import * as ansicolor from 'ansicolor';
import { CONFIG_FILE_NAME } from '../common-values';

export function parseTSMonorepoJson(json: string): TSMonorepoJson {
    // parse as json
    var parsedJson: any;
    try {
        parsedJson = parse(json, undefined, true);
    } catch(e) {
        if (e.name === "SyntaxError") {
            e.message = `\n ${ansicolor.magenta('subject:')} ${ansicolor.green(CONFIG_FILE_NAME)}${
                "\n"
            }   ${ansicolor.red("error")}: ${e.message} on line ${ansicolor.green(e.line)}, column ${ansicolor.green(""+(e.column+1))}\n`;
            e.stack = undefined;
        }
        e.name = `${CONFIG_FILE_NAME} parse error from library ${ansicolor.cyan("comment-json")}`;
        throw e;
    }

    // validate the json
    var configFileJSON: TSMonorepoJson | undefined;
    try {
        configFileJSON = validateConfigFile(parsedJson);
    } catch(e) {
        const error: Error = e;
        const tempCharStart = "→";
        error.name = `invalid ${CONFIG_FILE_NAME}`;
        function validationErrorFix(input: string) {
            const lines = (input
                .replace(new RegExp(`${error.name}: `, "g"), "") // remove error name from beginning of message
                .replace(/TSMonorepoJson/g, "\n" + tempCharStart + ansicolor.green(CONFIG_FILE_NAME)) // replace the type name of the validating TS interface with a temp char start
                .trimStart())
                .split("\n");
            //console.log(lines);
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
                .replace(/ should/g, "\n   " + ansicolor.red("error:") + " should")
                + "\n";
        }
        error.message = validationErrorFix(error.message);
        error.stack = undefined;
        throw error;
    }
    if (configFileJSON === undefined) {
        const configFileUndefinedError = new Error(`After parsing, the config file ${ansicolor.green(configFileRelativePath)} is undefined`);
        configFileUndefinedError.name = "Config file undefined";
        throw configFileUndefinedError;
    };
    return configFileJSON;
}