import * as t from 'io-ts';
import { MonorepoPackage } from "../../../../common/types/monorepo-package";
import { MonorepoPackageRegistry } from "../../../../package-dependencies/monorepo-package-registry";
import { PACKAGE_JSON_FILENAME } from "../../../../common/constants";
import { CachedLatestVersionFetcher } from "../../../cached-latest-version-fetcher";
import { NodeDependency } from '../../../../config-file-structural-checking/io-ts-trial';

export function monorepoPackageToPackageJsonOutput(monorepoPackage: MonorepoPackage, monorepoPackageRegistry: MonorepoPackageRegistry, latestVersionGetter: CachedLatestVersionFetcher): Object {
    const packageJsonConfig = monorepoPackage.config.files.json[PACKAGE_JSON_FILENAME];
    async function convertDependencies(dependencies: t.TypeOf<typeof NodeDependency>[]) {
        return Object.fromEntries(await Promise.all(dependencies
            .map(async function (dependency): Promise<[string, string]> {
                const [dependencyName, dependencyVersion] = Array.isArray(dependency) ? dependency : [dependency, undefined];
                if (dependencyVersion !== undefined) return [dependencyName, dependencyVersion];
                // We have to decide a version somehow.
                const dependentMonorepoPackage = monorepoPackageRegistry.getMonorepoPackageIfPresent(dependency);
                if (dependentMonorepoPackage !== undefined) return [dependencyName, dependentMonorepoPackage.version];
                return [dependencyName, await latestVersionGetter.latestVersion(dependencyName)]
            })));
    }
    // TODO: typescript version should be validated coming in. It should only be allowed to be equal to the primary typescript version? Maybe
    return Object.assign({}, packageJsonConfig,
        {
            dependencies: convertDependencies(packageJsonConfig.dependencies),
            devDependencies: convertDependencies(packageJsonConfig.devDependencies),
            peerDependencies: convertDependencies(packageJsonConfig.peerDependencies),
            optionalDependencies: convertDependencies(packageJsonConfig.optionalDependencies)
        });
}