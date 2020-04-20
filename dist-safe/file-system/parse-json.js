"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comment_json_1 = require("comment-json");
const ansicolor = require("ansicolor");
const constants_1 = require("../common/constants");
const errors_1 = require("../common/errors");
const colorize_special_text_1 = require("../colorize-special-text");
const either = require("fp-ts/lib/Either");
function parseJson(json) {
    try {
        return either.right(comment_json_1.parse(json, undefined, true));
    }
    catch (e) {
        if (e.name === "SyntaxError") {
            e.message = `\n ${ansicolor.magenta('subject:')} ${ansicolor.green(constants_1.CONFIG_FILE_NAME)}${"\n"}   ${ansicolor.red("error")}: ${e.message} on line ${ansicolor.green(e.line)}, column ${ansicolor.green("" + (e.column + 1))}`;
            e.stack = undefined;
        }
        e.name = `${colorize_special_text_1.colorize.file(constants_1.CONFIG_FILE_NAME)} parse error from library ${ansicolor.cyan("comment-json")}`;
        return either.left([{
                type: errors_1.ErrorType.JsonParseError,
                message: `${e.name}\n${e.message}`
            }]);
    }
}
exports.parseJson = parseJson;
//# sourceMappingURL=parse-json.js.map