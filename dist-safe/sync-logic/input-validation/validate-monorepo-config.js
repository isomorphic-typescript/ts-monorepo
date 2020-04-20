"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../common/errors");
const validate_scope_1 = require("./validate-scope");
const traverse_package_tree_1 = require("../traverse-package-tree");
const validate_templates_1 = require("./validate-templates");
const colorize_special_text_1 = require("../../colorize-special-text");
const package_config_1 = require("../converters/input-to-merged/package-config");
const constants_1 = require("../../common/constants");
const validateNpmPackageName = require("validate-npm-package-name");
const validate_package_config_1 = require("./validate-package-config");
const either = require("fp-ts/lib/Either");
const taskEither = require("fp-ts/lib/TaskEither");
const option = require("fp-ts/lib/Option");
const pipeable_1 = require("fp-ts/lib/pipeable");
const array = require("fp-ts/lib/Array");
const error_coalesce_1 = require("../error-coalesce");
const config_path_1 = require("../../common/console-formatters/config-path");
const validatePackage = (monorepoConfig, seenResolvedPackageNamesToConfigObjectPath, templates, packageRegistry) => (config, context, resolvedPackageName) => {
    const presentableConfigObjectPath = config_path_1.constructPresentableConfigObjectPath(context.configObjectPath);
    // First, the resulting package name must be valid
    const packageNameValidationResult = validateNpmPackageName(resolvedPackageName);
    if (!packageNameValidationResult.validForNewPackages) {
        const numberedErrors = packageNameValidationResult.errors ?
            packageNameValidationResult.errors.map((errorMessage, index) => `${index + 1}. ${errorMessage}`).join("\n")
            :
                "";
        return taskEither.left([{
                type: errors_1.ErrorType.InvalidPackageName,
                message: `Invalid package name ${colorize_special_text_1.colorize.package(resolvedPackageName)} which was resolved to by ${presentableConfigObjectPath}\n${numberedErrors}`
            }]);
    }
    // Second, there may not be any existing duplicate package names seen.
    const conflictingConfigObjectPath = seenResolvedPackageNamesToConfigObjectPath.get(resolvedPackageName);
    if (conflictingConfigObjectPath !== undefined) {
        return taskEither.left([{
                type: errors_1.ErrorType.DuplicateResolvedPackageName,
                message: `The package name ${colorize_special_text_1.colorize.package(resolvedPackageName)} is resolved to by both ${presentableConfigObjectPath} and ${config_path_1.constructPresentableConfigObjectPath(conflictingConfigObjectPath)}`
            }]);
    }
    else {
        seenResolvedPackageNamesToConfigObjectPath.set(resolvedPackageName, context.configObjectPath);
    }
    return pipeable_1.pipe(
    // Third, all of the templates that the package extends must be valid.
    config.extends, array.filter(extendsTemplateName => !templates.has(extendsTemplateName)), array.map(extendsTemplateName => !templates.has(extendsTemplateName) ?
        taskEither.left([{
                type: errors_1.ErrorType.NonExistentTemplate,
                message: `The package name ${colorize_special_text_1.colorize.package(resolvedPackageName)} extends non-existent template "${colorize_special_text_1.colorize.template(extendsTemplateName)}".`
            }]) :
        taskEither.right(constants_1.SUCCESS)), error_coalesce_1.taskEithercoalesceConfigErrors, 
    // Fourth, the package config itself should have valid contents (tsconfig.json and package.json have some values which this tool must set itself, and so the use may not set those values)
    taskEither.chain(() => taskEither.fromEither(validate_package_config_1.validatePackageConfig(config, `In package ${colorize_special_text_1.colorize.package(resolvedPackageName)} at ${presentableConfigObjectPath}`))), 
    // Merge configs with templates.
    taskEither.map(() => package_config_1.mergePackageConfig(templates, config, resolvedPackageName, monorepoConfig.version)), 
    // Register dependencies.
    taskEither.chain(mergedConfig => taskEither.fromEither(packageRegistry.registerPackage(mergedConfig, context.relativePath))));
};
const validateJunction = (_config, context, childContexts) => {
    const presentableConfigObjectPath = config_path_1.constructPresentableConfigObjectPath(context.configObjectPath);
    // Validate the children of the junction (subfolders) names. There validations are related to how the children package name segments map to sub-folder names.
    const pathSegmentToNameSegment = new Map();
    return pipeable_1.pipe(Object.entries(childContexts), array.map(([childNameSegment, childContext]) => {
        // Here we ensure that no two child config name segments correspond to the same sub-folder name.
        // This can happen since we remove the non alphanumeric characters from the beginning of the package name segment before creating the folder.
        const conflictingNameSegment = pathSegmentToNameSegment.get(childContext.pathSegment);
        if (conflictingNameSegment !== undefined) {
            return taskEither.left([{
                    type: errors_1.ErrorType.DuplicateSubfolder,
                    message: `Issue with package junction at ${presentableConfigObjectPath}. The two children with names ${colorize_special_text_1.colorize.package(conflictingNameSegment)} and ${colorize_special_text_1.colorize.package(childNameSegment)} correspond to a sub-folder named ${colorize_special_text_1.colorize.directory(childContext.pathSegment)}. One of the names must be changed or removed.`
                }]);
        }
        else {
            pathSegmentToNameSegment.set(childContext.pathSegment, childNameSegment);
        }
        // Here we ensure the resulting subfolder name isn't an empty string. You can't have a folder with an empty name. We do the check here instead of at the start of the validation functions
        // because it's a validation universal to both junction and package config.
        if (childContext.pathSegment.length === 0) {
            return taskEither.left([{
                    type: errors_1.ErrorType.SubfolderIsEmptyString,
                    message: `A key of package junction at ${presentableConfigObjectPath} resolves to an empty string.\nThe key "${colorize_special_text_1.colorize.package(childNameSegment)}" resolves to an empty string sub-folder which is illegal.`
                }]);
        }
        return taskEither.right(constants_1.SUCCESS);
    }), error_coalesce_1.taskEithercoalesceConfigErrors);
};
// See https://blog.npmjs.org/post/168978377570/new-package-moniker-rules
function ensureNoPackagesEquivalenGivenMonikerRule(packageRegistry) {
    return pipeable_1.pipe(Array.from(packageRegistry.getRegisteredPackages().values()), array.map(monorepoPackage => monorepoPackage.name), array.reduce(either.right(new Map()), (result, currentMonorepoPackageName) => pipeable_1.pipe(result, either.chain(seenPackageNamesWithoutPunctuation => {
        const currentMonorepoPackageNameSplitByScopeDivider = currentMonorepoPackageName.split('/');
        const currentMonorepoPackageNameWithoutScope = currentMonorepoPackageNameSplitByScopeDivider[currentMonorepoPackageNameSplitByScopeDivider.length - 1];
        const currentMonorepoPackageNameWithoutPunctuation = currentMonorepoPackageNameWithoutScope.replace(/[^a-zA-Z\d]/g, '');
        const otherPackageNameWithEquivalentPunctionRemovedName = seenPackageNamesWithoutPunctuation.get(currentMonorepoPackageNameWithoutPunctuation);
        if (otherPackageNameWithEquivalentPunctionRemovedName !== undefined) {
            return either.left([{
                    type: errors_1.ErrorType.DuplicateResolvedPackageName,
                    message: `Two packages:\n1. ${colorize_special_text_1.colorize.package(otherPackageNameWithEquivalentPunctionRemovedName)}\n2. ${colorize_special_text_1.colorize.package(currentMonorepoPackageName)}\nhave the same package name ${colorize_special_text_1.colorize.package(currentMonorepoPackageNameWithoutPunctuation)} after removing punction & scope.${"\n"}This is denied by npm. See https://blog.npmjs.org/post/168978377570/new-package-moniker-rules`
                }]);
        }
        else {
            seenPackageNamesWithoutPunctuation.set(currentMonorepoPackageNameWithoutPunctuation, currentMonorepoPackageName);
            return either.right(seenPackageNamesWithoutPunctuation);
        }
    }))), either.map(() => constants_1.SUCCESS));
}
function validateMonorepoConfig(monorepoConfig, packageRegistry) {
    return pipeable_1.pipe(option.fromNullable(monorepoConfig.templates), either.fromOption(() => new Map()), either.fold(either.right, validate_templates_1.validateAndMergeTemplates), taskEither.fromEither, taskEither.chain(mergedTemplates => pipeable_1.pipe(option.fromNullable(monorepoConfig.packages), either.fromOption(() => constants_1.SUCCESS), either.fold(taskEither.right, packages => pipeable_1.pipe(Object.entries(packages), array.map(([scope, packagesUnderScope]) => pipeable_1.pipe(validate_scope_1.validateScope(scope), either.map(() => traverse_package_tree_1.generateInitialContext(scope)), either.map(initialContext => traverse_package_tree_1.traversePackageTree(packagesUnderScope, initialContext, validatePackage(monorepoConfig, new Map(), mergedTemplates, packageRegistry), validateJunction)), taskEither.fromEither, taskEither.flatten)), error_coalesce_1.taskEithercoalesceConfigErrors)))), taskEither.chain(() => pipeable_1.pipe(ensureNoPackagesEquivalenGivenMonikerRule(packageRegistry), either.chain(() => packageRegistry.ensureNoCircularDependencies()), taskEither.fromEither)));
}
exports.validateMonorepoConfig = validateMonorepoConfig;
//# sourceMappingURL=validate-monorepo-config.js.map