import * as t from 'io-ts';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as either from 'fp-ts/lib/Either';
import * as array from 'fp-ts/lib/Array';
import { MonorepoPackage } from "../../../../common/types/monorepo-package";
import { MonorepoPackageRegistry } from "../../../../package-dependency-logic/monorepo-package-registry";
import { PACKAGE_JSON_FILENAME } from "../../../../common/constants";
import { CachedLatestVersionFetcher } from "../../../cached-latest-version-fetcher";
import { NodeDependency } from '../../../../common/types/io-ts/config-types';
import { ConfigError, ErrorType } from '../../../../common/errors';
import { pipe } from 'fp-ts/lib/pipeable';
import { taskEitherCoalesceConfigErrorsAndObject  } from '../../../error-coalesce';
import { colorize } from '../../../../colorize-special-text';
import * as option from 'fp-ts/lib/Option';

type DependencyType = ('dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies');

const getLatestVersionedDependencyEntry = (targetPackageName: string, dependencyType: DependencyType, dependencyName: string, latestVersionGetter: CachedLatestVersionFetcher)
    : taskEither.TaskEither<ConfigError[], [string, string]> => async () => {
    try {
        const latestVersion = await latestVersionGetter.latestVersion(dependencyName);
        return either.right([dependencyName, latestVersion]);
    } catch (e) {
        if (e.name === 'PackageNotFoundError') {
            return either.left([{
                type: ErrorType.UnknownPackageDependency,
                message: `${colorize.package(targetPackageName)} delcares ${colorize.package(dependencyName)} a member of ${colorize.file(PACKAGE_JSON_FILENAME)}[${dependencyType}].${
                    "\n"}However ${colorize.package(dependencyName)} is not registered in npm nor configured in the monorepo.`
            }])
        }
        throw e;
    }
}

function convertDependencies(
    targetPackageName: string,
    dependencyType: DependencyType,
    dependencies: t.TypeOf<typeof NodeDependency>[],
    monorepoPackageRegistry: MonorepoPackageRegistry,
    latestVersionGetter: CachedLatestVersionFetcher): taskEither.TaskEither<ConfigError[], Record<string, string>> {
    
    return pipe(
        dependencies,
        array.map(dependency => {
            const [dependencyName, dependencyVersion] = Array.isArray(dependency) ? dependency : [dependency, undefined];
            const maybeDependentMonorepoPackage = monorepoPackageRegistry.getMonorepoPackageIfCompatibleAndPresent(dependency);
            if (option.isSome(maybeDependentMonorepoPackage)) {
                if (dependencyVersion === undefined) {
                    return taskEither.right([dependencyName, maybeDependentMonorepoPackage.value.version]);
                } else {
                    return taskEither.right([dependencyName, dependencyVersion]);
                }
            } else {
                if (dependencyVersion === undefined) {
                    return getLatestVersionedDependencyEntry(targetPackageName, dependencyType, dependencyName, latestVersionGetter);
                } else {
                    return taskEither.right([dependencyName, dependencyVersion]);
                }
            }
        }),
        taskEitherCoalesceConfigErrorsAndObject,
        taskEither.map(Object.fromEntries)
    );
}

const dependencyKeys: DependencyType[] = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
];

// Yarn will remove empty deps objects from package.json, so the below line will prevent "adding [peerDependencies]: {...}"
// messages every time the ts-monorepo.json is saved.
function removeAllBlankDependencies(properPackageJsonObject: Object): Object {
    pipe(
        dependencyKeys,
        array.filter(key => Object.keys((properPackageJsonObject as any)[key]).length === 0),
        array.map(key => {
            delete (properPackageJsonObject as any)[key];
        })
    );
    return properPackageJsonObject;
}

export function monorepoPackageToPackageJsonOutput(
    monorepoPackage: MonorepoPackage,
    monorepoPackageRegistry: MonorepoPackageRegistry,
    latestVersionGetter: CachedLatestVersionFetcher): taskEither.TaskEither<ConfigError[], Object> {
    const packageJsonConfig = monorepoPackage.config.files.json[PACKAGE_JSON_FILENAME];
    // TODO: typescript version should be validated coming in. It should only be allowed to be equal to the primary typescript version? Maybe

    return pipe(
        dependencyKeys,
        array.map(key => pipe(
            convertDependencies(monorepoPackage.name, key, packageJsonConfig[key], monorepoPackageRegistry, latestVersionGetter),
            taskEither.map(convertedDependencies => [key, convertedDependencies])
        )),
        taskEitherCoalesceConfigErrorsAndObject,
        taskEither.map(Object.fromEntries),
        taskEither.map(allConvertedDependencies => Object.assign({}, packageJsonConfig, allConvertedDependencies)),
        taskEither.map(removeAllBlankDependencies)
    );
}