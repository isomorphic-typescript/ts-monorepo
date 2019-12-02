import * as ansicolor from 'ansicolor';
import * as path from 'path';
import * as fs from 'fs';

// Utils
import { fsAsync } from '../util/fs-async';
import { log } from '../util/log';
import { validateDirectoryPresence, validateSymlinkPresence } from '../util/validate-presence-in-file-system';

// Config File Validation
import validateNpmPackageName = require('validate-npm-package-name');
import { PackageDependencyTracker } from './package-dependency-tracker';
import { syncPackageJSON } from './specific-files/sync-package.json.js';
import { syncTSConfigJSON } from './specific-files/sync-tsconfig.json.js';
import { syncLernaJSON } from './specific-files/sync-lerna.json.js';
import { syncTSConfigLeavesJSON } from './specific-files/sync-tsconfig-leaves.json.js';
import { CommandRunner } from '../util/command-runner';
import { comprehensiveDelete } from '../util/recursive-delete-directory';
import { assertFileExists, assertDirectoryExistsOrCreate } from '../file-system/presence-assertions';
import { CONFIG_FILE_RELATIVE_PATH, CONFIG_FILE_ABSOLUTE_PATH, PACKAGES_DIRECTORY_RELATIVE_PATH, GLOBAL_SCOPE_NAME, PACKAGES_DIRECTORY_NAME, PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX } from '../common-values';
import { parseTSMonorepoJson } from '../config-file-structural-checking/parse';
import { validateScope } from './validate-scope';
import { ConfigError, ErrorType } from '../error';
import { Terminateable } from '../common-traits';
import { colorize } from '../colorize-special-text';
import { PackageConfig, PackageConfigJunction, isNotJunction } from '../config-file-structural-checking/config';
import { MonoreportPackageRegistry } from '../package-dependencies/monorepo-package-registry';

const CONFIGURATION_ERROR = new Error("See above error message(s)");
CONFIGURATION_ERROR.stack = undefined;
CONFIGURATION_ERROR.name = "ConfigurationError";

export async function syncMonorepo(): Promise<Terminateable> {
    PackageDependencyTracker.reset(); // TODO: remove once package registry finished.
    const packageRegistry = new MonoreportPackageRegistry();
    assertNoErrors(await assertFileExists(CONFIG_FILE_RELATIVE_PATH));
    const configFileContents = (await fs.promises.readFile(CONFIG_FILE_ABSOLUTE_PATH)).toString();
    // TODO: pass comments down to generated jsons (for json which supports this)
    // TODO: get a soucre map from loaded json object path to location range in json file. This will allow for better error reporting.
    const monorepoConfig = parseTSMonorepoJson(configFileContents);
    assertNoErrors(await assertDirectoryExistsOrCreate(PACKAGES_DIRECTORY_RELATIVE_PATH));

    // TODO: validate templates for circular references.

    const errors = (await Promise.all(Object.entries(monorepoConfig.packages)
        .map(async ([scopeName, packageTree]) => {
            const errors: ConfigError[] = [];

            // Scope
            errors.push(...validateScope(scopeName));
            if (errors.length > 0) return errors;
            const relativeScopeDirectoryPath = path.join(PACKAGES_DIRECTORY_RELATIVE_PATH, scopeName);
            
            //errors.push(...await assertFileExists(relativeScopeDirectoryPath));
            //if (errors.length > 0) return errors;

            interface ConfigTreeTraversalContext {
                packageNamePrefix: string;
                relativePath: string;
                pathSegment: string;
                configObjectPath: string[];
                packageNameSegment: string;
            }

            function constructPresentableConfigObjectPath(configObjectPath: string[]): string {
                return configObjectPath.map(key => `[${key}]`).join("");
            }

            const lowercaseAlphanumeric = /[a-z0-9]/;
            function removeLeadingPunctuation(packageNameSegment: string): string {
                for (var currentIndex = 0; currentIndex < packageNameSegment.length; ++currentIndex) {
                    if (packageNameSegment[currentIndex].match(lowercaseAlphanumeric)) {
                        return packageNameSegment.slice(currentIndex);
                    }
                }
                return "";
            }

            // Packages under scope.
            async function traversePackageTree(
                config: PackageConfig | PackageConfigJunction,
                context: ConfigTreeTraversalContext,
                packageHandler: (config: PackageConfig, context: ConfigTreeTraversalContext) => Promise<ConfigError[]>,
                junctionHandler: (config: PackageConfigJunction, context: ConfigTreeTraversalContext, childContexts: Record<string, ConfigTreeTraversalContext>) => Promise<ConfigError[]>): Promise<ConfigError[]> {
                const errors: ConfigError[] = [];
                if (isNotJunction(config)) {
                    errors.push(...await packageHandler(config, context));
                } else {
                    const childContexts: Record<string, ConfigTreeTraversalContext> = Object.fromEntries(Object.keys(config)
                        .map(nameSegment => {
                            const pathSegment = removeLeadingPunctuation(nameSegment);
                            return [
                                nameSegment,
                                {
                                    packageNamePrefix: `${context.packageNamePrefix}${nameSegment}`,
                                    relativePath: path.join(context.relativePath, pathSegment),
                                    configObjectPath: [...context.configObjectPath, nameSegment],
                                    pathSegment,
                                    packageNameSegment: nameSegment
                                }
                            ];
                        }));
                    errors.push(...await junctionHandler(config, context, childContexts));
                    if (errors.length > 0) return errors;

                    errors.push(...
                        (await Promise.all(
                            Object.entries(config)
                            .map(([nameSegment, childConfig]) => 
                                traversePackageTree(
                                    childConfig,
                                    childContexts[nameSegment],
                                    packageHandler, junctionHandler
                                )
                            )
                        )).flat()
                    );
                }
                return errors;
            }

            const scopePackageNameSegment = scopeName === GLOBAL_SCOPE_NAME ? "" : `${scopeName}/`;
            const initialContext: ConfigTreeTraversalContext = {
                packageNamePrefix: scopePackageNameSegment,
                relativePath: relativeScopeDirectoryPath,
                configObjectPath: [PACKAGES_DIRECTORY_NAME, scopeName],
                pathSegment: scopeName,
                packageNameSegment: scopePackageNameSegment
            };

            // First we validate
            const seenResolvedPackageNamesToConfigObjectPath = new Map<string, string[]>();
            errors.push(...await traversePackageTree(
                packageTree,
                initialContext,
                async function validatePackageConfig(_config: PackageConfig, context: ConfigTreeTraversalContext) {
                    const presentableConfigObjectPath = constructPresentableConfigObjectPath(context.configObjectPath);
                    // First, completed package name must end in a tilde.
                    if (!context.packageNamePrefix.endsWith(PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX)) {
                        return [{
                            type: ErrorType.PackageNameMissingSuffix,
                            message: `Issue with package at ${presentableConfigObjectPath}. The package name segment ${context.packageNameSegment} must end with ${PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX}.`
                        }];
                    }
                    // Second, after removing the tilde from the end of the complete package name, the resulting package name (one which will be used), must be valid
                    const resolvedPackageName = context.packageNamePrefix;
                    const packageNameValidationResult = validateNpmPackageName(resolvedPackageName);
                    if (!packageNameValidationResult.validForNewPackages) {
                        const numberedErrors = packageNameValidationResult.errors ?
                            packageNameValidationResult.errors.map((errorMessage, index) => `${index+1}. ${errorMessage}`).join("\n")
                            :
                            "";
                        return [{
                            type: ErrorType.InvalidPackageName,
                            message: `Invalid package name ${colorize.package(resolvedPackageName)} which was resolved to by ${presentableConfigObjectPath}\n${numberedErrors}`
                        }];
                    }
                    // Third, there may not be any existing duplicate final package names seen.
                    const conflictingConfigObjectPath = seenResolvedPackageNamesToConfigObjectPath.get(resolvedPackageName);
                    if (conflictingConfigObjectPath !== undefined) {
                        return [{
                            type: ErrorType.DuplicateResolvedPackageName,
                            message: `The package name ${colorize.package(resolvedPackageName)} is resolved to by both ${
                                presentableConfigObjectPath} and ${constructPresentableConfigObjectPath(conflictingConfigObjectPath)}`
                        }];
                    } else {
                        seenResolvedPackageNamesToConfigObjectPath.set(resolvedPackageName, context.configObjectPath);
                    }
                    return [];
                },
                async function validateJunction(_config: PackageConfigJunction, context: ConfigTreeTraversalContext, childContexts: Record<string, ConfigTreeTraversalContext>): Promise<ConfigError[]> {
                    const presentableConfigObjectPath = constructPresentableConfigObjectPath(context.configObjectPath);
                    // Make sure the segment doesn't end with a tilde.
                    if (context !== initialContext) { // If this is a junction beneath a junction beneath a scope (rather than the scope's junction).
                        if (context.packageNameSegment.endsWith(PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX)) {
                            return [
                                {
                                    type: ErrorType.JunctionWithPackageNameSuffix,
                                    message: `Issue with package junction at ${presentableConfigObjectPath}. The package name segment ${context.packageNameSegment} ends with ${
                                        PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX}. Only terminal package configs, not junction configs, should end with ${PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX}.`
                                }
                            ];
                        }
                    }
                    // Validate the children of the junction (subfolders) names. There validations are related to how the children package name segments map to sub-folder names.
                    const pathSegmentToNameSegment: Map<string, string> = new Map();
                    const errors: ConfigError[] = Object.entries(childContexts)
                        .map(([childNameSegment, childContext]) => {
                            // Here we ensure that no two child config name segments correspond to the same sub-folder name.
                            // This can happen since we remove the non alphanumeric characters from the beginning of the package name segment before creating the folder.
                            const conflictingNameSegment = pathSegmentToNameSegment.get(childContext.pathSegment);
                            if (conflictingNameSegment !== undefined) {
                                return [{
                                    type: ErrorType.DuplicateSubfolder,
                                    message: `Issue with package junction at ${presentableConfigObjectPath}. The two children with names ${
                                        colorize.package(conflictingNameSegment)} and ${colorize.package(childNameSegment)
                                    } correspond to a sub-folder named ${colorize.directory(childContext.pathSegment)
                                    }. One of the names must be changed or removed.`
                                }];
                            } else {
                                pathSegmentToNameSegment.set(childContext.pathSegment, childNameSegment);
                            }
                            // Here we ensure the resulting subfolder name isn't an empty string. You can't have a folder with an empty name. We do the check here instead of at the start of the validation functions
                            // because it's a validation universal to both junction and package config.
                            if (childContext.pathSegment.length === 0) {
                                return [{
                                    type: ErrorType.SubfolderIsEmptyString,
                                    message: `Issue with package junction at ${presentableConfigObjectPath}. The child with name ${colorize.package(childNameSegment)} resolves to an empty string sub-folder which is illegal`
                                }];
                            }
                            return [];
                        })
                        .flat();
                    return errors;
                }
            ))
            if (errors.length > 0) return errors;

            // Next we create folders, files
            errors.push(...await traversePackageTree(
                packageTree,
                initialContext,
                async function writeFilesForPackageConfig(config: PackageConfig, context: ConfigTreeTraversalContext) {
                    const errors: ConfigError[] = [];
                    errors.push(...await assertDirectoryExistsOrCreate(path.resolve(context.relativePath)));
                    if (errors.length > 0) return errors;

                    // Merge configs with templates.
                    // Register dependencies.

                    return errors;
                },
                async function createJunctionFolders(_config: PackageConfigJunction, context: ConfigTreeTraversalContext, _childContexts: Record<string, ConfigTreeTraversalContext>) {
                    return assertDirectoryExistsOrCreate(path.resolve(context.relativePath));
                }
            ));

            return errors;
        })))
        .flat();
    assertNoErrors(errors);

    // then iterate through registry and 1. Write files, 2. install dependencies.

    // TODO: we would like to have a feature whereby the user may choose specific package implementations
    // to override. Otherwise, on every install step, we would be trashing any discrepancies between the
    // installed dependency and the version of that dependency saved to npm.. This may be unintended behavior
    // for the user since they may want to override implementations in order to experiment with changes.

    // then dump registry's leaf packages to leaves file.

    // ORIGINAL BEGINS HERE

    const packageList = Object.keys(monorepoConfig.packages);
    if (packageList.length === 0) {
        log.error("Config file must have at least one package");
        throw CONFIGURATION_ERROR;
    }

    // Validate each package name
    var foundIssueWithAtLeastOnePackageName = false;
    for(const packageName of packageList) {
        const validationResult = validateNpmPackageName(packageName);
        if(!validationResult.validForNewPackages) {
            log.error(`'${ansicolor.magenta(packageName)}' is not a valid npm package name`);
            foundIssueWithAtLeastOnePackageName = true;
        }
    }
    if (foundIssueWithAtLeastOnePackageName) throw CONFIGURATION_ERROR;

    packageList.forEach(packageName => {
        PackageDependencyTracker.registerPackage(packageName, monorepoConfig as TSMonorepoConfig);
    });

    const leafPackages = PackageDependencyTracker.getLeafSet();
    log.info(`${leafPackages.size} total leaf packages:\n${
        Array.from(leafPackages)
            .map(packageName => "          " + ansicolor.magenta(packageName))
            .join("\n")
    }`);

    const lernaJSONPackagePaths = new Set<string>();

    var anyErrorsPreventingBuild = false;

    // Sync each package name
    for (const packageName of packageList) {
        const nameParts = packageName.split("/");
        const nameIsScoped = nameParts.length === 2;
        const relativePackagePath = packageRoot + '/' + packageName;
        
        const packageDirectoryAbsolutePath = path.resolve("./" + relativePackagePath);
        if (nameIsScoped) { // Means we have @scope-name/package-name pattern
            const scopedFolder = packageRoot + "/" + nameParts[0];
            const scopedFolderAbsolutePath = path.resolve("./" + scopedFolder);
            await validateDirectoryPresence(scopedFolderAbsolutePath, true, scopedFolder);
        }
        await validateDirectoryPresence(packageDirectoryAbsolutePath, true, relativePackagePath);
        const packageJSONSyncResult =
            await syncPackageJSON(packageName, relativePackagePath, packageDirectoryAbsolutePath, monorepoConfig);
        const tsConfigSyncResult =
            await syncTSConfigJSON(packageName, relativePackagePath, nameIsScoped, packageDirectoryAbsolutePath, monorepoConfig);

        if (monorepoConfig.cleanBeforeCompile) {
            // Removing the tsconfig.tsbuildinfo file in each package will force typescript to recompile everything.
            const buildInfoFilePath = path.join(packageDirectoryAbsolutePath, "tsconfig.tsbuildinfo");
            const buildInfoFileExists = await fsAsync.exists(buildInfoFilePath);
            if (buildInfoFileExists) {
                await fsAsync.deleteFile(buildInfoFilePath);
            }
            // Remove the dist folder
            if (tsConfigSyncResult.obj.compilerOptions && tsConfigSyncResult.obj.compilerOptions.outDir !== undefined) {
                const distDir = tsConfigSyncResult.obj.compilerOptions.outDir;
                const distDirRelative = path.join(relativePackagePath, distDir)
                    .replace(/\\/g, "/"); // deal with windows
                const distDirAbsolute = path.resolve("./" + distDirRelative);
                await comprehensiveDelete(distDirAbsolute);
            }
        }

        if(monorepoConfig.packages[packageName].publishDistributionFolder === true) {
            if (tsConfigSyncResult.obj.compilerOptions && tsConfigSyncResult.obj.compilerOptions.outDir !== undefined) {
                const outDir = tsConfigSyncResult.obj.compilerOptions.outDir;
                const packagePublishingRelativeDirectory = path.join(relativePackagePath, outDir)
                    .replace(/\\/g, "/"); // deal with windows
                const packagePublishingAbsoluteDirectory = path.resolve("./" + packagePublishingRelativeDirectory);
                log.info(`${ansicolor.white("publishDistributionFolder")} enabled for package ${ansicolor.magenta(packageName)}.`);
                // Sync package.json to dist folder
                await validateDirectoryPresence(packagePublishingAbsoluteDirectory, true, packagePublishingRelativeDirectory);
                await fsAsync.writeFile(path.resolve(packagePublishingAbsoluteDirectory, "package.json"), packageJSONSyncResult.text);
                lernaJSONPackagePaths.add(packagePublishingRelativeDirectory);

                const nodeModules = "node_modules";
                const distributionNodeModulesAbsolutePath = path.resolve(packagePublishingAbsoluteDirectory, nodeModules);
                await validateDirectoryPresence(distributionNodeModulesAbsolutePath, true, relativePackagePath + "/" + nodeModules);
                const packageNodeModulesAbsolutePath = path.resolve(packageDirectoryAbsolutePath, nodeModules);
                await validateSymlinkPresence(packageNodeModulesAbsolutePath, distributionNodeModulesAbsolutePath, false, relativePackagePath + "/" + nodeModules, packagePublishingRelativeDirectory + "/" + nodeModules);
            } else {
                log.error(`Package ${ansicolor.magenta(packageName)} has ${ansicolor.lightGray(`"${ansicolor.white("publishDistributionFolder")}"`)} enabled, but ts-monorepo requires${
                    "\n          "
                }that its ${ansicolor.green("tsconfig.json")} contain the field ${ansicolor.lightGray(`"${ansicolor.white("compilerOptions")}"."${ansicolor.white("outDir")}"`)} to enable this feature.`);
                anyErrorsPreventingBuild = true;
            }
        } else {
            lernaJSONPackagePaths.add(relativePackagePath);
        }
    }
    
    if(anyErrorsPreventingBuild) {
        const preBuildError = new Error("See above messages for details.");
        preBuildError.name = "pre-build error";
        throw preBuildError;
    }

    // Lerna
    await syncLernaJSON(lernaJSONPackagePaths, monorepoConfig);

    if(monorepoConfig.cleanBeforeCompile) {
        // This will remove all the node_modules folders of each package.
        const lernaCleanCommand = "npx lerna clean --yes";
        const lernaClean = new CommandRunner(lernaCleanCommand);
        lernaClean.start();
        await lernaClean.waitUntilDone();
    }

    const lernaInstallAndLinkCommand = "npx lerna bootstrap"; // TODO: add hoisting?
    const lernaBoostrap = new CommandRunner(lernaInstallAndLinkCommand);
    lernaBoostrap.start();
    await lernaBoostrap.waitUntilDone();

    // tsc (or ttsc)
    await syncTSConfigLeavesJSON(leafPackages, monorepoConfig);

    return monorepoConfig.ttypescript;
}

function assertNoErrors(errors: ConfigError[]) {
    if (errors.length > 0) {
        const throwable = new Error();
        throwable.name = "monorepo issues";
        throwable.stack = undefined;
        throwable.message = errors
            .map(error => `${error.type}:\n${error.message}`)
            .join("\n\n");
        throw throwable;
    }
}