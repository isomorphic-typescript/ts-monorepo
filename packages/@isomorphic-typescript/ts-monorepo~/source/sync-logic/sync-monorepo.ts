import * as fs from 'fs';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as array from 'fp-ts/lib/Array';
import { assertFileSystemObjectType, assertDirectoryExistsOrCreate } from '../file-system/presence-assertions';
import { CONFIG_FILE_RELATIVE_PATH, CONFIG_FILE_ABSOLUTE_PATH, PACKAGES_DIRECTORY_RELATIVE_PATH, TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH, TS_MONOREPO_FOLDER_RELATIVE_PATH, SUCCESS, Success, MONOREPO_PACKAGE_JSON_RELATIVE_PATH } from '../common/constants';
import { parseJson } from '../file-system/parse-json';
import { ConfigError, ErrorType } from '../common/errors';
import { Terminateable } from '../common/types/traits';
import { traversePackageTree, generateInitialContext } from './traverse-package-tree';
import { MonorepoPackageRegistry } from '../package-dependency-logic/monorepo-package-registry';
import { validateMonorepoConfig } from './input-validation/validate-monorepo-config';
import { FileSystemObjectType } from '../file-system/object';
import { writeMonorepoPackageFiles } from './converters/monorepo-to-output/write-monorepo-package-files';
import { writeJsonAndReportChanges } from './writers/json';
import { monorepoPackageRegistryToTSProjectLeavesJsonOutput } from './converters/monorepo-to-output/files/ts-project-leaves.json';
import { CachedLatestVersionFetcher } from './cached-latest-version-fetcher';
import { taskEithercoalesceConfigErrors } from './error-coalesce';
import { validateTSMonoRepoJsonShape } from '../common/types/io-ts/config-types';
import { validateNoUnexpectedFolders } from './validate-no-unexpected-folders';
import { installViaBerry } from '../package-dependency-logic/berry-install/install-with-berry';
import { startTypeScript } from '../process/typescript-runner';
import { monorepoPackageRegistryToMonorepoRootPackageJson } from './converters/monorepo-to-output/files/monorepo-package.json';

export function syncMonorepo(): taskEither.TaskEither<ConfigError[], Terminateable> {
    const packageRegistry = new MonorepoPackageRegistry();
    const cachedLatestVersionFetcher = new CachedLatestVersionFetcher();

    // TODO: pass comments down to generated jsons (for json which supports this)
    // TODO: get a source map from loaded json object path to location range in json file. This will allow for better error reporting and eventual VSCode plugin.

    return pipe(
        // 1. Read in monorepo config
        assertFileSystemObjectType(CONFIG_FILE_RELATIVE_PATH, [FileSystemObjectType.file]),
        taskEither.chain(() => async () => either.right((await fs.promises.readFile(CONFIG_FILE_ABSOLUTE_PATH)).toString())),
        taskEither.chain(json => taskEither.fromEither(parseJson(json))), // Switch to chainEither when 2.4 comes out
        taskEither.chain(validateTSMonoRepoJsonShape),
        taskEither.chain(monorepoConfig => pipe(
            // 2. Validate config file
            validateMonorepoConfig(monorepoConfig, packageRegistry),
            taskEither.chain(() => {
                if (packageRegistry.getLeafSet().size === 0) {
                    return taskEither.left<ConfigError[]>([{
                        type: ErrorType.NoLeafPackages,
                        message: "No leaf packages detected. There must be at least one."
                    }])
                } else {
                    return taskEither.right(SUCCESS);
                }
            }),
            // 3. Write directories
            taskEither.chain(() => pipe(
                option.fromNullable(monorepoConfig.packages),
                either.fromOption<Success>(() => SUCCESS),
                taskEither.fromEither,
                taskEither.fold(
                    taskEither.right,
                    packages => pipe(
                        assertDirectoryExistsOrCreate(PACKAGES_DIRECTORY_RELATIVE_PATH),
                        taskEither.chain(() => pipe(
                            Object.entries(packages),
                            array.map(([scopeName, packagesUnderScope]) => traversePackageTree(
                                packagesUnderScope,
                                generateInitialContext(scopeName),
                                (_config, context) => assertDirectoryExistsOrCreate(context.relativePath),
                                (_config, context) => assertDirectoryExistsOrCreate(context.relativePath)
                            )),
                            taskEithercoalesceConfigErrors
                        ))
                    )
                )
            )),
            // 4. Make sure no unexpected folders exist
            taskEither.chain(() => validateNoUnexpectedFolders(monorepoConfig)), // TODO: add watchers so that if unexpected objects are removed, then sync is rerun.
            // 5. Write files.
            taskEither.chain(() => pipe(
                Array.from(packageRegistry.getRegisteredPackages()),
                array.map(monorepoPackage => writeMonorepoPackageFiles(monorepoPackage, packageRegistry, cachedLatestVersionFetcher)),
                taskEithercoalesceConfigErrors
            )),
            taskEither.chain(() => pipe(
                assertDirectoryExistsOrCreate(TS_MONOREPO_FOLDER_RELATIVE_PATH),
                taskEither.chain(() => writeJsonAndReportChanges(
                    TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH,
                    monorepoPackageRegistryToTSProjectLeavesJsonOutput(packageRegistry)
                )),
                taskEither.chain(() => monorepoPackageRegistryToMonorepoRootPackageJson(packageRegistry)),
                taskEither.chain(packageJsonObject => writeJsonAndReportChanges(
                    MONOREPO_PACKAGE_JSON_RELATIVE_PATH,
                    packageJsonObject
                )),
            )),
            // 6. Install dependencies.
            taskEither.chain(installViaBerry),
            // 7. Set up watchers
            taskEither.map(() => {
                return startTypeScript(monorepoConfig);
            })
        ))
    );
}