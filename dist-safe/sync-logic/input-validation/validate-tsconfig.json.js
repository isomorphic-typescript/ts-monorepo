"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const either = require("fp-ts/lib/Either");
const array = require("fp-ts/lib/Array");
const errors_1 = require("../../common/errors");
const constants_1 = require("../../common/constants");
const pipeable_1 = require("fp-ts/lib/pipeable");
const error_coalesce_1 = require("../error-coalesce");
const colorize_special_text_1 = require("../../colorize-special-text");
exports.MandatoryTSConfigJsonValues = {
    compilerOptions: {
        rootDir: constants_1.TS_CONFIG_JSON_ROOT_DIR,
        outDir: constants_1.TS_CONFIG_JSON_OUT_DIR,
        // See https://github.com/RyanCavanaugh/learn-a#tsconfigsettingsjson
        composite: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
    },
    references: []
};
function ensureValueNotSetExplicitly(field, compilerOptions, errorType, tsConfig, configLocation) {
    function generateError(fullFieldName) {
        return {
            type: errorType,
            message: `${configLocation} the ${colorize_special_text_1.colorize.file('tsconfig.json')} config illegally sets field '${colorize_special_text_1.colorize.type(fullFieldName)}' explicitly. ${colorize_special_text_1.colorize.package(constants_1.TOOL_SHORT_NAME)} will set this for you.`
        };
    }
    if (compilerOptions) {
        if (field in tsConfig.compilerOptions) {
            return either.left([generateError(`compilerOptions.${field}`)]);
        }
    }
    else {
        if (field in tsConfig) {
            return either.left([generateError(field)]);
        }
    }
    return either.right(constants_1.SUCCESS);
}
// TODO: validate based on the non-overrideable settings 
function validateTSConfigJson(tsConfig, configLocation) {
    return pipeable_1.pipe([
        (() => {
            if (tsConfig.compilerOptions) {
                return pipeable_1.pipe(Object.keys(exports.MandatoryTSConfigJsonValues.compilerOptions), array.map(mandatoryValueKey => ensureValueNotSetExplicitly(mandatoryValueKey, true, errors_1.ErrorType.ExplicitlySetNonOverridableValueInTSConfigJson, tsConfig, configLocation)), error_coalesce_1.eitherCoalesceConfigErrors);
            }
            return either.right(constants_1.SUCCESS);
        })(),
        ensureValueNotSetExplicitly('references', false, errors_1.ErrorType.ExplicitlySetNonOverridableValueInTSConfigJson, tsConfig, configLocation)
    ], error_coalesce_1.eitherCoalesceConfigErrors);
}
exports.validateTSConfigJson = validateTSConfigJson;
//# sourceMappingURL=validate-tsconfig.json.js.map