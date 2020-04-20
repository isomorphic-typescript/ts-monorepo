"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const either = require("fp-ts/lib/Either");
const array = require("fp-ts/lib/Array");
const errors_1 = require("../../common/errors");
const constants_1 = require("../../common/constants");
const colorize_special_text_1 = require("../../colorize-special-text");
const pipeable_1 = require("fp-ts/lib/pipeable");
const error_coalesce_1 = require("../error-coalesce");
// TODO: when validating, ensure that client has not explicitly set this (similar to tsconfig.json). Also consider making such logic & validations more generic.
exports.MANDATORY_PACKAGE_JSON_VALUES = {
    installConfig: {
        pnp: true
    }
};
function validateDependencies(dependencies, dependencyField, configLocation) {
    if (dependencies) {
        const seenDeps = new Set();
        const depsWithError = new Set();
        return pipeable_1.pipe(dependencies, array.map(dependency => {
            const dependencyName = Array.isArray(dependency) ? dependency[0] : dependency;
            if (seenDeps.has(dependencyName)) {
                if (!depsWithError.has(dependencyName)) {
                    depsWithError.add(dependencyName);
                    return either.left([{
                            type: errors_1.ErrorType.DuplicateDependencyInPackageJsonConfig,
                            message: `${configLocation} the package.json ${dependencyField} has multiple entries for package ${colorize_special_text_1.colorize.package(dependencyName)}`
                        }]);
                }
            }
            else {
                seenDeps.add(dependencyName);
            }
            return either.right(constants_1.SUCCESS);
        }), error_coalesce_1.eitherCoalesceConfigErrors);
    }
    return either.right(constants_1.SUCCESS);
}
function validatePackageJson(packageJson, configLocation) {
    return pipeable_1.pipe([
        (() => {
            const packageJsonWithAnyPossibleValue = packageJson;
            if ('name' in packageJsonWithAnyPossibleValue) {
                return either.left([{
                        type: errors_1.ErrorType.ExplicitNameInPackageJsonConfig,
                        message: `${configLocation} the package.json illegally specifies an explicit name '${packageJsonWithAnyPossibleValue.name}'. Package names will be written to output package.json files by contatenating nested keys under the ${constants_1.PACKAGES_DIRECTORY_NAME} object.`
                    }]);
            }
            return either.right(constants_1.SUCCESS);
        })(),
        validateDependencies(packageJson.dependencies, 'dependencies', configLocation),
        validateDependencies(packageJson.devDependencies, 'devDependencies', configLocation),
        validateDependencies(packageJson.optionalDependencies, 'optionalDependencies', configLocation),
        validateDependencies(packageJson.peerDependencies, 'peerDependencies', configLocation)
    ], error_coalesce_1.eitherCoalesceConfigErrors);
}
exports.validatePackageJson = validatePackageJson;
//# sourceMappingURL=validate-package.json.js.map