import * as ansicolor from 'ansicolor';
import * as path from 'path';

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

export async function syncPackages(configFileRelativePath: string, configAbsolutePath: string) {
    PackageDependencyTracker.reset();

    const configFilePresence = await validateFilePresence(
        configAbsolutePath, 
        undefined,
        configFileRelativePath);
    if (!configFilePresence.exists || configFilePresence.wrong) return;

    // Read config file.
    const configFileContents = (await fsAsync.readFile(configAbsolutePath)).toString();
    
    // TODO: Strip the json file contents of comments before attempting to parse it.

    // parse as json
    var configFileJSON: TSMonorepoConfig | undefined;
    try {
        configFileJSON = validateConfigFile(JSON.parse(configFileContents));
    } catch(e) {
        const tempCharStart = "→";
        e.name = "invalid ts-monorepo.json";
        function validationErrorFix(input: string) {
            const lines = (input
                .replace(new RegExp(`${e.name}: `, "g"), "") // remove error name from beginning of message
                .replace(/TSMonorepoConfig\./g, "\n" + tempCharStart) // replace the type name of the validating TS interface with a temp char start
                .trimStart())
                .split("\n");
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
                .replace(new RegExp(tempCharStart, 'g'), "   " + ansicolor.magenta("field: "))
                .replace(/ should/g, "\n   " + ansicolor.red("error:") + " should")
                + "\n";
        }
        if(!e.message.includes("in JSON at position")) {
            e.message = validationErrorFix(e.message);
        }
        e.stack = undefined;
        throw e;
    }
    if (configFileJSON === undefined) return;

    // Validate the package root.
    const packageRoot = configFileJSON.packageRoot;
    if (packageRoot.length === 0) {
        log.error("The 'packageRoot' field may not be empty.");
        return;
    }
    if (packageRoot.includes("/") || packageRoot.includes("\\")) {
        log.error(`The value of the 'packageRoot' field '${ansicolor.white(packageRoot)}' currently contains at least one of the forbidden characters '/' or '\\'.`);
        return;
    }
    if (packageRoot === "." || packageRoot === "..") {
        log.error(`The value of the 'packageRoot' field '${ansicolor.white(packageRoot)}' is illegal.`);
        return;
    }
    const packageRootAbsolutePath = path.resolve(".", packageRoot);

    await validateDirectoryPresence(packageRootAbsolutePath, true, packageRoot);

    const packageList = Object.keys(configFileJSON.packages);
    if (packageList.length === 0) {
        log.error("Config file must have at least one package");
        return;
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
    if (foundIssueWithAtLeastOnePackageName) return;

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
    
    if(anyErrorsPreventingBuild) return;

    // Lerna
    await syncLernaJSON(lernaJSONPackagePaths, configFileJSON);
    const lernaInstallAndLinkCommand = "npx lerna bootstrap"; // TODO: add hoist?
    const lernaBoostrap = new CommandRunner(lernaInstallAndLinkCommand);
    lernaBoostrap.start();
    await lernaBoostrap.waitUntilDone();

    // tsc
    await syncTSConfigLeavesJSON(leafPackages, configFileJSON);
}