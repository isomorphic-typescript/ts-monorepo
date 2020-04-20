"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = require("./files/package.json");
const deepmerge = require("deepmerge");
const colorize_special_text_1 = require("../../../colorize-special-text");
const constants_1 = require("../../../common/constants");
const validate_tsconfig_json_1 = require("../../input-validation/validate-tsconfig.json");
const validate_package_json_1 = require("../../input-validation/validate-package.json");
function mergePackageConfig(templates, subject, name = "", version) {
    var _a, _b, _c;
    var result = version ? {
        files: {
            json: {
                "package.json": {
                    version
                }
            }
        }
    } :
        {};
    // 2. Merge templates into result.
    const templatesToMerge = [...subject.extends];
    for (var templateName = templatesToMerge.shift(); templateName !== undefined; templateName = templatesToMerge.shift()) {
        const currentTemplate = templates.get(templateName);
        if (currentTemplate === undefined) {
            throw new Error(`Template to merge ${colorize_special_text_1.colorize.template(templateName)} is unknown`);
        }
        result = deepmerge(result, currentTemplate);
    }
    // 3. Merge subject into result.
    const packageJSON = (subject.files && subject.files.json) ? subject.files.json["package.json"] : undefined;
    const packageConfigMerged = {
        files: Object.assign(Object.assign({}, ((_a = subject.files) !== null && _a !== void 0 ? _a : {})), { json: Object.assign(Object.assign({}, ((_c = (_b = subject === null || subject === void 0 ? void 0 : subject.files) === null || _b === void 0 ? void 0 : _b.json) !== null && _c !== void 0 ? _c : {})), { "package.json": package_json_1.convertToMergedPackageJSON(name, packageJSON) }) })
    };
    result = deepmerge(result, packageConfigMerged);
    // 4. Merge non-overridable settings into result
    result = deepmerge(result, {
        files: {
            json: {
                [constants_1.PACKAGE_JSON_FILENAME]: validate_package_json_1.MANDATORY_PACKAGE_JSON_VALUES,
                [constants_1.TS_CONFIG_JSON_FILENAME]: validate_tsconfig_json_1.MandatoryTSConfigJsonValues
            }
        }
    });
    return result;
}
exports.mergePackageConfig = mergePackageConfig;
//# sourceMappingURL=package-config.js.map