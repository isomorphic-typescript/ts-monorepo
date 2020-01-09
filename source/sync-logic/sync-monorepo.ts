import * as fs from 'fs';
import * as taskEither from 'fp-ts/lib/TaskEither'; // { TaskEither, chain, map, fromEither, fold, right }
import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as array from 'fp-ts/lib/Array';
import { assertFileSystemObjectType, assertDirectoryExistsOrCreate } from '../file-system/presence-assertions';
import { CONFIG_FILE_RELATIVE_PATH, CONFIG_FILE_ABSOLUTE_PATH, PACKAGES_DIRECTORY_RELATIVE_PATH, TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH, TS_MONOREPO_FOLDER_RELATIVE_PATH, SUCCESS, Success } from '../common/constants';
import { parseJson } from '../config-file-structural-checking/parse';
import { ConfigError } from '../common/errors';
import { Terminateable } from '../common/traits';
import { traversePackageTree, generateInitialContext } from './traverse-package-tree';
import { MonorepoPackageRegistry } from '../package-dependencies/monorepo-package-registry';
import { validateMonorepoConfig } from './input-validation/validate-monorepo-config';
import { FileSystemObjectType } from '../file-system/object';
import { writeMonorepoPackageFiles } from './converters/monorepo-to-output/write-monorepo-package-files';
import { writeJsonAndReportChanges } from './writers/json';
import { monorepoPackageRegistryToTSProjectLeavesJsonOutput } from './converters/monorepo-to-output/files/ts-project-leaves.json';
import { CachedLatestVersionFetcher } from './cached-latest-version-fetcher';
import { CommandRunner } from '../util/command-runner';
import { taskEithercoalesceConfigErrors } from './error-coalesce';
import { log } from '../util/log';
import { validateTSMonoRepoJsonShape } from '../config-file-structural-checking/io-ts-trial';
import { validateNoUnexpectedFolders } from './validate-no-unexpected-folders';

const npmToolName = require("../../package.json").name;

function generateTSBuildCommand(ttypescipt: boolean) {
    return `npx ./node_modules/${npmToolName}/node_modules/.bin/${ttypescipt ? "t" : ""}tsc -b --watch --preserveWatchOutput ${TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH}`;
}

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
            taskEither.chain(() => assertDirectoryExistsOrCreate(TS_MONOREPO_FOLDER_RELATIVE_PATH)),
            taskEither.chain(() => writeJsonAndReportChanges(
                TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH,
                monorepoPackageRegistryToTSProjectLeavesJsonOutput(packageRegistry)
            )),
            // 6. Install dependencies.
            // 7. Set up watchers
            taskEither.map(() => {
                if (packageRegistry.getLeafSet().size === 0) {
                    log.info("No packages to compile.");
                    log.info("Waiting for changes...");
                    return {
                        terminate: async () => {}
                    };
                }
                const buildTask = new CommandRunner(generateTSBuildCommand(monorepoConfig.ttypescript));
                return {
                    terminate: async () => {
                        await buildTask.kill();
                    }
                }
            })
        ))
    );
    // TODO: clean before compile usage.

    // TODO: we would like to have a feature whereby the user may choose specific package implementations
    // to override. Otherwise, on every install step, we would be trashing any discrepancies between the
    // installed dependency and the version of that dependency saved to npm.. This may be unintended behavior
    // for the user since they may want to override implementations in order to experiment with changes.
}