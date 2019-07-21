import * as ansicolor from 'ansicolor';
import * as path from 'path';
import { parse } from 'comment-json';

// Utils
import { fsAsync } from '../util/fs-async';
import { log } from '../util/log';
import { validateFilePresence, validateDirectoryPresence, validateSymlinkPresence } from '../util/validate-presence-in-file-system';

// Config File Validation
import validateConfigFile, { TSMonorepoConfig } from '../config-file-structural-checking/config.validator';
import validateNpmPackageName = require('validate-npm-package-name');
import { PackageDependencyTracker } from './package-dependency-tracker';
import { syncPackageJSON } from './sync-package.json';
import { syncTSConfigJSON } from './sync-tsconfig.json';
import { syncLernaJSON } from './sync-lerna.json';
import { syncTSConfigLeavesJSON } from './sync-tsconfig-leaves.json';
import { CommandRunner } from '../util/command-runner';

const CONFIGURATION_ERROR = new Error("See above error message(s)");
CONFIGURATION_ERROR.stack = undefined;
CONFIGURATION_ERROR.name = "ConfigurationError";

export async function syncPackages(configFileRelativePath: string, configAbsolutePath: string) {
    PackageDependencyTracker.reset();

    const configFilePresence = await validateFilePresence(
        configAbsolutePath, 
        undefined,
        configFileRelativePath);
    if (!configFilePresence.exists) {
        const fileDoesntExists = new Error(`The config file ${ansicolor.green(configFileRelativePath)} could not be found`);
        fileDoesntExists.name = "Config file not found";
        throw fileDoesntExists;
    } else if (configFilePresence.wrong) {
        throw CONFIGURATION_ERROR;
    }

    // Read config file.
    const configFileContents = (await fsAsync.readFile(configAbsolutePath)).toString();
    
    // TODO: pass comments down to generated jsons.

    // parse as json
    var parsedJson: any;
    try {
        parsedJson = parse(configFileContents, undefined, true);
    } catch(e) {
        if (e.name === "SyntaxError") {
            e.message = `\n ${ansicolor.magenta('subject:')} ${ansicolor.green("ts-monorepo.json")}${
                "\n"
            }   ${ansicolor.red("error")}: ${e.message} on line ${ansicolor.green(e.line)}, column ${ansicolor.green(""+(e.column+1))}\n`;
            e.stack = undefined;
        }
        e.name = "ts-monorepo.json parse error from library " + ansicolor.cyan("comment-json");
        throw e;
    }

    // validate the json
    var configFileJSON: TSMonorepoConfig | undefined;
    try {
        configFileJSON = validateConfigFile(parsedJson);
    } catch(e) {
        const error: Error = e;
        const tempCharStart = "→";
        error.name = "invalid ts-monorepo.json";
        function validationErrorFix(input: string) {
            const lines = (input
                .replace(new RegExp(`${error.name}: `, "g"), "") // remove error name from beginning of message
                .replace(/TSMonorepoConfig/g, "\n" + tempCharStart + ansicolor.green("ts-monorepo.json")) // replace the type name of the validating TS interface with a temp char start
                .trimStart())
                .split("\n");
            //console.log(lines);
            var i = 0;
            for(const line of lines) {
                if (!line.startsWith(tempCharStart)) {
                    break;
                }
                i++
            }
            return "\n" + lines.slice(0, i)
                .join("\n")
                .replace(/, \n/g, "\n\n") 
                .replace(new RegExp(tempCharStart, 'g'), " " + ansicolor.magenta("subject: "))
                .replace(/ should/g, "\n   " + ansicolor.red("error:") + " should")
                + "\n";
        }
        error.message = validationErrorFix(error.message);
        error.stack = undefined;
        throw error;
    }
    if (configFileJSON === undefined) {
        const configFileUndefinedError = new Error(`After parsing, the config file ${ansicolor.green(configFileRelativePath)} is undefined`);
        configFileUndefinedError.name = "Config file undefined";
        throw configFileUndefinedError;
    };

    // Validate the package root.
    const packageRoot = configFileJSON.packageRoot;
    if (packageRoot.length === 0) {
        log.error("The 'packageRoot' field may not be empty.");
        throw CONFIGURATION_ERROR;
    }
    if (packageRoot.includes("/") || packageRoot.includes("\\")) {
        log.error(`The value of the 'packageRoot' field '${ansicolor.white(packageRoot)}' currently contains at least one of the forbidden characters '/' or '\\'.`);
        throw CONFIGURATION_ERROR;
    }
    if (packageRoot === "." || packageRoot === "..") {
        log.error(`The value of the 'packageRoot' field '${ansicolor.white(packageRoot)}' is illegal.`);
        throw CONFIGURATION_ERROR;
    }
    const packageRootAbsolutePath = path.resolve(".", packageRoot);

    await validateDirectoryPresence(packageRootAbsolutePath, true, packageRoot);

    const packageList = Object.keys(configFileJSON.packages);
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
        PackageDependencyTracker.registerPackage(packageName, configFileJSON as TSMonorepoConfig);
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
            await syncPackageJSON(packageName, relativePackagePath, packageDirectoryAbsolutePath, configFileJSON);
        const tsConfigSyncResult =
            await syncTSConfigJSON(packageName, relativePackagePath, nameIsScoped, packageDirectoryAbsolutePath, configFileJSON);

        if (configFileJSON.cleanBeforeCompile) {
            // Removing the tsconfig.tsbuildinfo file in each package will force typescript to recompile everything.
            const buildInfoFilePath = path.join(packageDirectoryAbsolutePath, "tsconfig.tsbuildinfo");
            const buildInfoFileExists = await fsAsync.exists(buildInfoFilePath);
            if (buildInfoFileExists) {
                await fsAsync.deleteFile(buildInfoFilePath);
            }
        }

        if(configFileJSON.packages[packageName].publishDistributionFolder === true) {
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
    await syncLernaJSON(lernaJSONPackagePaths, configFileJSON);

    if(configFileJSON.cleanBeforeCompile) {
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
    await syncTSConfigLeavesJSON(leafPackages, configFileJSON);

    return configFileJSON.ttypescript;
}