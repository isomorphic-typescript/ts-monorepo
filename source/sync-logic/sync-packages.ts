import * as ansicolor from 'ansicolor';
import * as path from 'path';
import * as child_process from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(child_process.exec);

// Utils
import { fsAsync } from '../util/fs-async';
import { log } from '../util/log';
import { validateFilePresence, validateDirectoryPresence } from '../util/validate-presence-in-file-system';

// Config File Validation
import validateConfigFile from '../config-file-structural-checking/config.validator';
import validateNpmPackageName = require('validate-npm-package-name');
import { PackageDependencyTracker } from './package-dependency-tracker';
import { syncPackageJSON } from './sync-package.json';
import { syncTSConfigJSON } from './sync-tsconfig.json';
import { syncLernaJSON } from './sync-lerna.json';
import { syncTSConfigLeavesJSON } from './sync-tsconfig-leaves.json';

export async function syncPackages(configFileRelativePath: string, configAbsolutePath: string) {
    const configFilePresence = await validateFilePresence(
        configAbsolutePath, 
        false, false,
        undefined,
        configFileRelativePath);
    if (!configFilePresence.exists || configFilePresence.wrong) return;

    // Read config file.
    const configFileContents = (await fsAsync.readFile(configAbsolutePath)).toString();
    
    // TODO: Strip the json file contents of comments before attempting to parse it.

    // parse as json
    const configFileJSON = validateConfigFile(JSON.parse(configFileContents));

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

    await validateDirectoryPresence(packageRootAbsolutePath, false, false, true, packageRoot);

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
        PackageDependencyTracker.registerPackage(packageName, configFileJSON);
    });
    const leafPackages = PackageDependencyTracker.getLeafSet();
    log.info(`${leafPackages.size} total leaf packages:\n${
        Array.from(leafPackages)
            .map(packageName => "          " + ansicolor.magenta(packageName))
            .join("\n")
    }`);

    const lernaJSONPackagePaths = new Set<string>();

    // Sync each package name
    for (const packageName of packageList) {
        const nameParts = packageName.split("/");
        const nameIsScoped = nameParts.length === 2;
        const relativePackagePath = packageRoot + '/' + packageName;
        const packageDirectoryAbsolutePath = path.resolve("./" + relativePackagePath);
        if (nameIsScoped) { // Means we have @scope-name/package-name pattern
            const scopedFolder = packageRoot + "/" + nameParts[0];
            lernaJSONPackagePaths.add(scopedFolder + "/*");
            const scopedFolderAbsolutePath = path.resolve("./" + scopedFolder);
            await validateDirectoryPresence(scopedFolderAbsolutePath, false, false, true, scopedFolder);
        } else {
            lernaJSONPackagePaths.add(packageRoot + "/*");
        }
        await validateDirectoryPresence(packageDirectoryAbsolutePath, false, false, true, relativePackagePath);
        await syncPackageJSON(packageName, relativePackagePath, packageDirectoryAbsolutePath, configFileJSON);
        await syncTSConfigJSON(packageName, relativePackagePath, nameIsScoped, packageDirectoryAbsolutePath, configFileJSON);
    }

    // Lerna
    await syncLernaJSON(lernaJSONPackagePaths, configFileJSON);
    const lernaInstallAndLinkCommand = "npx lerna bootstrap"; // TODO: add hoist?
    log.info(`Running '${ansicolor.white(lernaInstallAndLinkCommand.split(" ").slice(1).join(" "))}'`);
    const {stdout, stderr} = await execAsync(lernaInstallAndLinkCommand);

    if(stdout) {
        stdout.split("\n")
            .filter(line => line.length > 0)
            .forEach(line => {
                log.info(line);
            });
    }
    if(stderr) {
        stderr.split("\n")
            .filter(line => line.length > 0)
            .forEach(line => {
                log.info(line);
            });
    }

    // tsc
    await syncTSConfigLeavesJSON(leafPackages, configFileJSON);
}