import { MonorepoPackageRegistry } from "../../package-dependency-logic/monorepo-package-registry";
import { ConfigError, ErrorType } from "../../common/errors";
import { traversePackageTree, generateInitialContext, ConfigTreeTraversalContext } from "../traverse-package-tree";
import { validateAndMergeTemplates } from "./validate-templates";
import { colorize } from "../../colorize-special-text";
import { mergePackageConfig } from "../converters/input-to-merged/package-config";
import { SUCCESS, Success } from "../../common/constants";
import validateNpmPackageName = require('validate-npm-package-name');
import { validatePackageConfig } from "./validate-package-config";
import * as either from 'fp-ts/lib/Either';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { pipe } from 'fp-ts/function'
import * as array from 'fp-ts/lib/Array';
import { taskEithercoalesceConfigErrors } from "../error-coalesce";
import { MergedPackageConfig } from "../../common/types/merged-config";
import { TSMonorepoJson, PackageConfig, JunctionConfig } from "../../common/types/io-ts/config-types";
import { constructPresentableConfigObjectPath } from "../../common/console-formatters/config-path";

const validatePackage = 
    (monorepoConfig: t.TypeOf<typeof TSMonorepoJson>, seenResolvedPackageNamesToConfigObjectPath: Map<string, string[]>, templates: Map<string, MergedPackageConfig>, packageRegistry: MonorepoPackageRegistry) => 
    (config: t.TypeOf<typeof PackageConfig>, context: ConfigTreeTraversalContext, resolvedPackageName: string): taskEither.TaskEither<ConfigError[], Success> => {
    const presentableConfigObjectPath = constructPresentableConfigObjectPath(context.configObjectPath);
    
    // First, the resulting package name must be valid
    const packageNameValidationResult = validateNpmPackageName(resolvedPackageName);
    if (!packageNameValidationResult.validForNewPackages) {
        const numberedErrors = packageNameValidationResult.errors ?
            packageNameValidationResult.errors.map((errorMessage, index) => `${index+1}. ${errorMessage}`).join("\n")
            :
            "";
        return taskEither.left([{
            type: ErrorType.InvalidPackageName,
            message: `Invalid package name ${colorize.package(resolvedPackageName)} which was resolved to by ${presentableConfigObjectPath}\n${numberedErrors}`
        }]);
    }

    // Second, there may not be any existing duplicate package names seen.
    const conflictingConfigObjectPath = seenResolvedPackageNamesToConfigObjectPath.get(resolvedPackageName);
    if (conflictingConfigObjectPath !== undefined) {
        return taskEither.left([{
            type: ErrorType.DuplicateResolvedPackageName,
            message: `The package name ${colorize.package(resolvedPackageName)} is resolved to by both ${
                presentableConfigObjectPath} and ${constructPresentableConfigObjectPath(conflictingConfigObjectPath)}`
        }]);
    } else {
        seenResolvedPackageNamesToConfigObjectPath.set(resolvedPackageName, context.configObjectPath);
    }
    
    return pipe(
        // Third, all of the templates that the package extends must be valid.
        config.extends,
        array.filter(extendsTemplateName => !templates.has(extendsTemplateName)),
        array.map(extendsTemplateName => !templates.has(extendsTemplateName) ? 
            taskEither.left([{
                type: ErrorType.NonExistentTemplate,
                message: `The package name ${colorize.package(resolvedPackageName)} extends non-existent template "${colorize.template(extendsTemplateName)}".`
            }]) :
            taskEither.right(SUCCESS)
        ),
        taskEithercoalesceConfigErrors,
        // Fourth, the package config itself should have valid contents (tsconfig.json and package.json have some values which this tool must set itself, and so the use may not set those values)
        taskEither.chain(() => taskEither.fromEither(validatePackageConfig(config, `In package ${colorize.package(resolvedPackageName)} at ${presentableConfigObjectPath}`))),
        // Merge configs with templates.
        taskEither.map(() => mergePackageConfig(templates, config, resolvedPackageName, monorepoConfig.version)),
        // Register dependencies.
        taskEither.chain(mergedConfig => taskEither.fromEither(packageRegistry.registerPackage(mergedConfig, context.relativePath)))
    );
}

const validateJunction = 
    (_config: t.TypeOf<typeof JunctionConfig>, context: ConfigTreeTraversalContext, childContexts: Record<string, ConfigTreeTraversalContext>): taskEither.TaskEither<ConfigError[], Success> => {
    const presentableConfigObjectPath = constructPresentableConfigObjectPath(context.configObjectPath);
    // Validate the children of the junction (subfolders) names. There validations are related to how the children package name segments map to sub-folder names.
    const pathSegmentToNameSegment: Map<string, string> = new Map();
    return pipe(
        Object.entries(childContexts),
        array.map(([childNameSegment, childContext]) => {
            // Here we ensure that no two child config name segments correspond to the same sub-folder name.
            // This can happen since we remove the non alphanumeric characters from the beginning of the package name segment before creating the folder.
            const conflictingNameSegment = pathSegmentToNameSegment.get(childContext.pathSegment);
            if (conflictingNameSegment !== undefined) {
                return taskEither.left([{
                    type: ErrorType.DuplicateSubfolder,
                    message: `Issue with package junction at ${presentableConfigObjectPath}. The two children with names ${
                        colorize.package(conflictingNameSegment)} and ${colorize.package(childNameSegment)
                    } correspond to a sub-folder named ${colorize.directory(childContext.pathSegment)
                    }. One of the names must be changed or removed.`
                }]);
            } else {
                pathSegmentToNameSegment.set(childContext.pathSegment, childNameSegment);
            }
            // Here we ensure the resulting subfolder name isn't an empty string. You can't have a folder with an empty name. We do the check here instead of at the start of the validation functions
            // because it's a validation universal to both junction and package config.
            if (childContext.pathSegment.length === 0) {
                return taskEither.left([{
                    type: ErrorType.SubfolderIsEmptyString,
                    message: `A key of package junction at ${presentableConfigObjectPath} resolves to an empty string.\nThe key "${colorize.package(childNameSegment)}" resolves to an empty string sub-folder which is illegal.`
                }]);
            }
            return taskEither.right(SUCCESS);
        }),
        taskEithercoalesceConfigErrors
    );
}

// See https://blog.npmjs.org/post/168978377570/new-package-moniker-rules
function ensureNoPackagesEquivalenGivenMonikerRule(packageRegistry: MonorepoPackageRegistry): either.Either<ConfigError[], Success> {
    return pipe(
        Array.from(packageRegistry.getRegisteredPackages().values()),
        array.map(monorepoPackage => monorepoPackage.name),
        array.reduce(either.right<ConfigError[], Map<string, string>>(new Map()), (result, currentMonorepoPackageName) => pipe(
            result,
            either.chain(seenPackageNamesWithoutPunctuation => {
                const currentMonorepoPackageNameSplitByScopeDivider = currentMonorepoPackageName.split('/');
                const currentMonorepoPackageNameWithoutScope = currentMonorepoPackageNameSplitByScopeDivider[currentMonorepoPackageNameSplitByScopeDivider.length - 1];
                const currentMonorepoPackageNameWithoutPunctuation = currentMonorepoPackageNameWithoutScope.replace(/[^a-zA-Z\d]/g, '');
                const otherPackageNameWithEquivalentPunctionRemovedName = seenPackageNamesWithoutPunctuation.get(currentMonorepoPackageNameWithoutPunctuation);
                if (otherPackageNameWithEquivalentPunctionRemovedName !== undefined) {
                    return either.left([{
                        type: ErrorType.DuplicateResolvedPackageName,
                        message: `Two packages:\n1. ${colorize.package(otherPackageNameWithEquivalentPunctionRemovedName)}\n2. ${colorize.package(currentMonorepoPackageName)
                        }\nhave the same package name ${colorize.package(currentMonorepoPackageNameWithoutPunctuation)} after removing punction & scope.${
                            "\n"}This is denied by npm. See https://blog.npmjs.org/post/168978377570/new-package-moniker-rules`
                    } as ConfigError]);
                } else {
                    seenPackageNamesWithoutPunctuation.set(currentMonorepoPackageNameWithoutPunctuation, currentMonorepoPackageName);
                    return either.right(seenPackageNamesWithoutPunctuation);
                }
            })
        )),
        either.map(() => SUCCESS)
    )
}

export function validateMonorepoConfig(monorepoConfig: t.TypeOf<typeof TSMonorepoJson>, packageRegistry: MonorepoPackageRegistry): taskEither.TaskEither<ConfigError[], Success> {
    return pipe(
        option.fromNullable(monorepoConfig.templates),
        either.fromOption(() => new Map()),
        either.fold(either.right, validateAndMergeTemplates),
        taskEither.fromEither,
        taskEither.chain(mergedTemplates => pipe(
            option.fromNullable(monorepoConfig.packages),
            either.fromOption<Success>(() => SUCCESS),
            either.fold(
                taskEither.right,
                packages => pipe(
                    Object.entries(packages),
                    array.map(([scope, packagesUnderScope]) => traversePackageTree(
                        packagesUnderScope,
                        generateInitialContext(scope),
                        validatePackage(monorepoConfig, new Map(), mergedTemplates, packageRegistry),
                        validateJunction
                    )),
                    taskEithercoalesceConfigErrors
                )
            )
        )),
        taskEither.chain(() => pipe(
            ensureNoPackagesEquivalenGivenMonikerRule(packageRegistry),
            either.chain(() => packageRegistry.ensureNoCircularDependencies()),
            taskEither.fromEither
        ))
    );
}