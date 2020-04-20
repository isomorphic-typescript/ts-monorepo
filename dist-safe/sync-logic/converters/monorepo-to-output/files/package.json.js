"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const taskEither = require("fp-ts/lib/TaskEither");
const either = require("fp-ts/lib/Either");
const array = require("fp-ts/lib/Array");
const constants_1 = require("../../../../common/constants");
const errors_1 = require("../../../../common/errors");
const pipeable_1 = require("fp-ts/lib/pipeable");
const error_coalesce_1 = require("../../../error-coalesce");
const colorize_special_text_1 = require("../../../../colorize-special-text");
const option = require("fp-ts/lib/Option");
const getLatestVersionedDependencyEntry = (targetPackageName, dependencyType, dependencyName, latestVersionGetter) => () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const latestVersion = yield latestVersionGetter.latestVersion(dependencyName);
        return either.right([dependencyName, latestVersion]);
    }
    catch (e) {
        if (e.name === 'PackageNotFoundError') {
            return either.left([{
                    type: errors_1.ErrorType.UnknownPackageDependency,
                    message: `${colorize_special_text_1.colorize.package(targetPackageName)} delcares ${colorize_special_text_1.colorize.package(dependencyName)} a member of ${colorize_special_text_1.colorize.file(constants_1.PACKAGE_JSON_FILENAME)}[${dependencyType}].${"\n"}However ${colorize_special_text_1.colorize.package(dependencyName)} is not registered in npm nor configured in the monorepo.`
                }]);
        }
        throw e;
    }
});
function convertDependencies(targetPackageName, dependencyType, dependencies, monorepoPackageRegistry, latestVersionGetter) {
    return pipeable_1.pipe(dependencies, array.map(dependency => {
        const [dependencyName, dependencyVersion] = Array.isArray(dependency) ? dependency : [dependency, undefined];
        const maybeDependentMonorepoPackage = monorepoPackageRegistry.getMonorepoPackageIfCompatibleAndPresent(dependency);
        if (option.isSome(maybeDependentMonorepoPackage)) {
            if (dependencyVersion === undefined) {
                return taskEither.right([dependencyName, maybeDependentMonorepoPackage.value.version]);
            }
            else {
                return taskEither.right([dependencyName, dependencyVersion]);
            }
        }
        else {
            if (dependencyVersion === undefined) {
                return getLatestVersionedDependencyEntry(targetPackageName, dependencyType, dependencyName, latestVersionGetter);
            }
            else {
                return taskEither.right([dependencyName, dependencyVersion]);
            }
        }
    }), error_coalesce_1.taskEitherCoalesceConfigErrorsAndObject, taskEither.map(Object.fromEntries));
}
function monorepoPackageToPackageJsonOutput(monorepoPackage, monorepoPackageRegistry, latestVersionGetter) {
    const packageJsonConfig = monorepoPackage.config.files.json[constants_1.PACKAGE_JSON_FILENAME];
    // TODO: typescript version should be validated coming in. It should only be allowed to be equal to the primary typescript version? Maybe
    const dependencyKeys = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies'
    ];
    return pipeable_1.pipe(dependencyKeys, array.map(key => pipeable_1.pipe(convertDependencies(monorepoPackage.name, key, packageJsonConfig[key], monorepoPackageRegistry, latestVersionGetter), taskEither.map(convertedDependencies => [key, convertedDependencies]))), error_coalesce_1.taskEitherCoalesceConfigErrorsAndObject, taskEither.map(Object.fromEntries), taskEither.map(allConvertedDependencies => Object.assign({}, packageJsonConfig, allConvertedDependencies)));
}
exports.monorepoPackageToPackageJsonOutput = monorepoPackageToPackageJsonOutput;
//# sourceMappingURL=package.json.js.map