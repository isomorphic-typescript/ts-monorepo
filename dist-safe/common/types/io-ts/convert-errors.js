"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../errors");
const colorize_special_text_1 = require("../../../colorize-special-text");
const ansicolor = require("ansicolor");
const constants_1 = require("../../constants");
const config_path_1 = require("../../console-formatters/config-path");
const exactly_1 = require("./exactly");
exports.convertErorrs = (pathPrefix, additionalMessage) => (errors) => {
    return errors.map(error => ({
        type: errors_1.ErrorType.InvalidConfig,
        message: (() => {
            var _a;
            const lastContextEntry = error.context[error.context.length - 1];
            var priorContextEntry = undefined;
            const contextWithParentTags = [];
            for (var i = 0; i < error.context.length; ++i) {
                contextWithParentTags[i] = {
                    parentTag: (_a = priorContextEntry === null || priorContextEntry === void 0 ? void 0 : priorContextEntry.type) === null || _a === void 0 ? void 0 : _a._tag,
                    entry: error.context[i]
                };
                priorContextEntry = error.context[i];
            }
            const keyPath = config_path_1.constructPresentableConfigObjectPath([
                ...pathPrefix,
                ...contextWithParentTags
                    .slice(1)
                    .filter(contextEntry => contextEntry.parentTag !== 'IntersectionType')
                    .map(contextEntry => contextEntry.entry.key)
            ]);
            const badValue = lastContextEntry.actual;
            const badValueString = typeof badValue === 'string' ?
                `string value "${colorize_special_text_1.colorize.badValue(badValue)}"` :
                Array.isArray(badValue) ?
                    `array [${colorize_special_text_1.colorize.badValue(String(badValue))}]` :
                    lastContextEntry.type instanceof exactly_1.Exactly ?
                        `object with unrecognized key "${colorize_special_text_1.colorize.badValue(error.message)}"` :
                        // else
                        `value ${colorize_special_text_1.colorize.badValue(JSON.stringify(badValue))}`;
            return `\n ${ansicolor.magenta('subject:')} ${colorize_special_text_1.colorize.file(constants_1.CONFIG_FILE_NAME)}${keyPath}${"\n"}   ${ansicolor.red('error:')} expected type ${colorize_special_text_1.colorize.type(lastContextEntry.type.name)} but instead got ${badValueString}${additionalMessage ? "\n\n" + additionalMessage : ""}`;
        })()
    }));
};
//# sourceMappingURL=convert-errors.js.map