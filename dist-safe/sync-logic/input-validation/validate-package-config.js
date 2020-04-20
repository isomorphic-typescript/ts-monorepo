"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate_package_json_1 = require("./validate-package.json");
const validate_tsconfig_json_1 = require("./validate-tsconfig.json");
const either = require("fp-ts/lib/Either");
const constants_1 = require("../../common/constants");
const pipeable_1 = require("fp-ts/lib/pipeable");
const error_coalesce_1 = require("../error-coalesce");
function validatePackageConfig(packageConfig, configLocation) {
    if (packageConfig.files && packageConfig.files.json) {
        const packageJson = packageConfig.files.json["package.json"];
        const tsConfigJson = packageConfig.files.json["tsconfig.json"];
        return pipeable_1.pipe([
            (packageJson ? validate_package_json_1.validatePackageJson(packageJson, configLocation) : either.right(constants_1.SUCCESS)),
            (tsConfigJson ? validate_tsconfig_json_1.validateTSConfigJson(tsConfigJson, configLocation) : either.right(constants_1.SUCCESS))
        ], error_coalesce_1.eitherCoalesceConfigErrors);
    }
    return either.right(constants_1.SUCCESS);
}
exports.validatePackageConfig = validatePackageConfig;
//# sourceMappingURL=validate-package-config.js.map