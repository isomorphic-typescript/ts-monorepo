import * as deepmerge from 'deepmerge';
import * as latestVersion from 'latest-version';
import * as path from 'path';

import TSMonorepoConfig, { PackageJSON } from "../config-file-structural-checking/config";
import { PackageDependencyTracker } from './package-dependency-tracker';
import { syncGenericJSON } from './sync-generic.json';

export async function syncPackageJSON(packageName: string, relativePackageName: string, absolutePackagePath: string, configFileJSON: TSMonorepoConfig) {
    const resultingPackageJSONObj: PackageJSON = deepmerge(
        deepmerge(
            configFileJSON.baseConfigs["package.json"], 
            configFileJSON.packages[packageName].configs["package.json"]
        ),
        {
            name: packageName,
            version: configFileJSON.version
        }
    );

    const dependenciesWithinMonorepo = PackageDependencyTracker.getDependenciesOf(packageName);

    async function resolveDependencies(dependencies: string[] | undefined): Promise<{[dependency: string]: string} | undefined> {
        if (dependencies === undefined) return undefined;
        return Object.fromEntries(
            await Promise.all(dependencies.map(async dependency => [
                // package name
                dependency,

                // package version
                dependenciesWithinMonorepo.has(dependency) ?
                    configFileJSON.version :
                    `^${await latestVersion(dependency)}`
            ])));
    }

    const [dependencies, devDependencies, peerDependencies] = await Promise.all([
        resolveDependencies(resultingPackageJSONObj.dependencies),
        resolveDependencies(resultingPackageJSONObj.devDependencies),
        resolveDependencies(resultingPackageJSONObj.peerDependencies)
    ]);
    if (dependencies) (resultingPackageJSONObj as any).dependencies = dependencies;
    if (devDependencies) (resultingPackageJSONObj as any).devDependencies = devDependencies;
    if (peerDependencies) (resultingPackageJSONObj as any).peerDependencies = peerDependencies;
    
    const relativePackageJSONPath = relativePackageName + "/" + "package.json";
    const absolutePackageJSONPath = path.resolve(absolutePackagePath, "package.json");

    await syncGenericJSON(absolutePackageJSONPath, relativePackageJSONPath, resultingPackageJSONObj);
}