import * as taskEither from 'fp-ts/lib/TaskEither';
import * as array from 'fp-ts/lib/Array';
import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { MonorepoPackageRegistry } from "../monorepo-package-registry";
import { ConfigError } from '../../common/errors';
import { Success } from '../../common/constants';
import * as semver from 'semver';
import { pipe } from 'fp-ts/lib/pipeable';
import { MonorepoPackage } from '../../common/types/monorepo-package';
import * as pacote from 'pacote';
import { CachedManifestGetter } from './cachedManifestGetter';
import { CachedLatestVersionFetcher } from '../../sync-logic/cached-latest-version-fetcher';
import { NodeDependency } from '../../common/types/io-ts/config-types';

type SingleDependencyPlan = {
    optional: boolean;
    version: string;
    subPlan: NodeModulesPlan;
    peers: Record<string, string>;
}

interface NodeModulesPlan {
    [packageName: string]: SingleDependencyPlan;
}

function getNameVersionEntries(monorepoDependencies: t.TypeOf<typeof NodeDependency>[], packageRegistry: MonorepoPackageRegistry, optional: boolean,
    cachedLatestVersionFetcher: CachedLatestVersionFetcher): Promise<{name: string, version: string, optional: boolean}[]> {
    return Promise.all(monorepoDependencies.map(async nodeDependency => {
        // We keep on destructuring and restructuring and calling getMonorepoPackageIfCompatibleAndPresent. Must be very inefficient. TODO: improve efficiency.
        const [dependencyPackageName, dependencyPackageVersion] = Array.isArray(nodeDependency) ? nodeDependency : [nodeDependency];
        const maybeMonorepoPackageDependency = packageRegistry.getMonorepoPackageIfCompatibleAndPresent(nodeDependency);
        if (option.isSome(maybeMonorepoPackageDependency)) {
            return {
                name: dependencyPackageName,
                version: maybeMonorepoPackageDependency.value.version,
                optional
            };
        } else if (dependencyPackageVersion === undefined) {
            return {
                name: dependencyPackageName,
                version: await cachedLatestVersionFetcher.latestVersion(dependencyPackageName),
                optional
            };
        } else {
            return {
                name: dependencyPackageName,
                version: dependencyPackageVersion,
                optional
            };
        }
    }));
}

async function constructNodeModulesPlan(parentPackage: string | undefined, packageName: string, packageVersion: string, packageRegistry: MonorepoPackageRegistry,
    cachedManifestGetter: CachedManifestGetter, cachedLatestVersionFetcher: CachedLatestVersionFetcher): taskEither.TaskEither<ConfigError[], SingleDependencyPlan> {
    const maybeMonorepoPackage = packageRegistry.getMonorepoPackageIfCompatibleAndPresent([packageName, packageVersion]);

    if (option.isSome(maybeMonorepoPackage)) {

        const monorepoPackage = maybeMonorepoPackage.value;
        const packageJson = monorepoPackage.config.files.json["package.json"];
        const plan: NodeModulesPlan = Object.fromEntries([
            ...await getNameVersionEntries(packageJson.dependencies, packageRegistry, false, cachedLatestVersionFetcher),
            ...(parentPackage === undefined ? (await getNameVersionEntries(packageJson.devDependencies, packageRegistry, false, cachedLatestVersionFetcher)) : []),
            ...await getNameVersionEntries(packageJson.optionalDependencies, packageRegistry, true, cachedLatestVersionFetcher)
        ].map(({name, version, optional}) => [name, {
            version,
            optional,
            subPlan: {},
            peers: {}
        }]))
        if (parentPackage === undefined) {
            // Include devDependencies
            includeInPlan(packageJson.devDependencies);
        }
    } else {
        const manifest = cachedManifestGetter.getManifest(parentPackage ?? packageName, packageName, packageVersion);
    }
}

function recursivelyInstallPackagsForCurrentLevel(packageWithDependencies: string, packageRegistry: MonorepoPackageRegistry, currentPlan: NodeModulesPlan, currentPath: string[]) {
    const currentLevel = currentPath.length;
}

export function installDependencies(packageRegistry: MonorepoPackageRegistry): taskEither.TaskEither<ConfigError[], Success> {
    pipe(
        Array.from(packageRegistry.getRegisteredPackages().values()),
        array.map(monorepoPackage => recursivelyInstallPackagsForCurrentLevel(monorepoPackage.name, {}, []))
    );
}