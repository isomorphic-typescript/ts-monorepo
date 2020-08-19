import * as path from 'path';
import { MonorepoPackage } from "../../../common/types/monorepo-package";
import { writeJsonAndReportChanges } from "../../writers/json";
import { monorepoPackageToPackageJsonOutput } from './files/package.json';
import { monorepoPakcageToTSConfigJsonOutput } from './files/tsconfig.json';
import { assertDirectoryExistsOrCreate } from '../../../file-system/presence-assertions';
import { ConfigError } from '../../../common/errors';
import { TS_CONFIG_JSON_OUT_DIR, TS_CONFIG_JSON_ROOT_DIR, PACKAGE_JSON_FILENAME, TS_CONFIG_JSON_FILENAME, SUCCESS, Success } from '../../../common/constants';
import { MonorepoPackageRegistry } from '../../../package-dependency-logic/monorepo-package-registry';
import { CachedLatestVersionFetcher } from '../../cached-latest-version-fetcher';
import * as taskEither from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import * as array from 'fp-ts/lib/Array';
import { taskEithercoalesceConfigErrors } from '../../error-coalesce';
import { writeIgnoreAndReportChanges } from '../../writers/ignore';

// TODO: come up with a more generic way to support file writers. Perhaps a plugin system? Eventually we want JSON, ignore, TOML, YAML, txt, pipfile, etc.
export function writeMonorepoPackageFiles(monorepoPackage: MonorepoPackage, monorepoPackageRegistry: MonorepoPackageRegistry,
    latestVersionGetter: CachedLatestVersionFetcher): taskEither.TaskEither<ConfigError[], Success> {
    return pipe(
        [
            assertDirectoryExistsOrCreate(path.join(monorepoPackage.relativePath, TS_CONFIG_JSON_OUT_DIR)),
            assertDirectoryExistsOrCreate(path.join(monorepoPackage.relativePath, TS_CONFIG_JSON_ROOT_DIR))
        ],
        taskEithercoalesceConfigErrors,
        // 1. JSON files
        taskEither.chain(() => pipe(
            Object.entries(monorepoPackage.config.files.json),
            array.map(([jsonFilename, jsonObject]) => {
                // Write templated config files
                const pathToFile = path.join(monorepoPackage.relativePath, jsonFilename);
                const outputObjectTaskEither = 
                    jsonFilename === PACKAGE_JSON_FILENAME ? monorepoPackageToPackageJsonOutput(monorepoPackage, monorepoPackageRegistry, latestVersionGetter) :
                    jsonFilename === TS_CONFIG_JSON_FILENAME ? taskEither.right(monorepoPakcageToTSConfigJsonOutput(monorepoPackage)) :
                    taskEither.right(jsonObject);
                return pipe(
                    outputObjectTaskEither,
                    taskEither.chain(outputObject => writeJsonAndReportChanges(pathToFile, outputObject)),
                    taskEither.chain(() => taskEither.right(SUCCESS))
                );
            }),
            taskEithercoalesceConfigErrors
        )),
        // 2. ignore files (ie. .gitignore, .npmignore)
        taskEither.chain(() => pipe(
            Object.entries(monorepoPackage.config.files.ignore),
            array.map(([ignoreFileName, ignoreFileLines]) => {
                const pathToFile = path.join(monorepoPackage.relativePath, ignoreFileName);
                return pipe(
                    writeIgnoreAndReportChanges(pathToFile, ignoreFileLines),
                    taskEither.chain(() => taskEither.right(SUCCESS))
                );
            }),
            taskEithercoalesceConfigErrors
        ))
        // 3. TODO: support other file types.
    );
}