import * as path from 'path';
import { MonorepoPackage } from "../../../common/types/monorepo-package";
import { writeJsonAndReportChanges } from "../../writers/json";
import { monorepoPackageToPackageJsonOutput } from './files/package.json';
import { monorepoPakcageToTSConfigJsonOutput } from './files/tsconfig.json';
import { assertDirectoryExistsOrCreate } from '../../../file-system/presence-assertions';
import { ConfigError } from '../../../common/errors';
import { TS_CONFIG_JSON_OUT_DIR, TS_CONFIG_JSON_ROOT_DIR, PACKAGE_JSON_FILENAME, TS_CONFIG_JSON_FILENAME, SUCCESS, Success } from '../../../common/constants';
import * as fs from 'fs';
import { MonorepoPackageRegistry } from '../../../package-dependencies/monorepo-package-registry';
import { CachedLatestVersionFetcher } from '../../cached-latest-version-fetcher';
import { TaskEither, chain } from 'fp-ts/lib/TaskEither';
import { right } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { map as arrayMap} from 'fp-ts/lib/Array';
import { taskEithercoalesceConfigErrors } from '../../error-coalesce';

export function writeMonorepoPackageFiles(monorepoPackage: MonorepoPackage, monorepoPackageRegistry: MonorepoPackageRegistry,
    latestVersionGetter: CachedLatestVersionFetcher): TaskEither<ConfigError[], Success> {
    return pipe(
        [
            assertDirectoryExistsOrCreate(path.join(monorepoPackage.relativePath, TS_CONFIG_JSON_OUT_DIR)),
            assertDirectoryExistsOrCreate(path.join(monorepoPackage.relativePath, TS_CONFIG_JSON_ROOT_DIR))
        ],
        taskEithercoalesceConfigErrors,
        chain(() => pipe(
            Object.entries(monorepoPackage.config.files.json), // TODO: support other file types.
            arrayMap(([jsonFilename, jsonObject]) => {
                // Write templated config files
                const pathToFile = path.resolve(monorepoPackage.relativePath, jsonFilename);
                const outputObject = 
                    jsonFilename === PACKAGE_JSON_FILENAME ? monorepoPackageToPackageJsonOutput(monorepoPackage, monorepoPackageRegistry, latestVersionGetter) :
                    jsonFilename === TS_CONFIG_JSON_FILENAME ? monorepoPakcageToTSConfigJsonOutput(monorepoPackage) :
                    jsonObject;
                return pipe(
                    writeJsonAndReportChanges(pathToFile, outputObject),
                    chain(outputJsonString => async () => {
                        // By default we copy package.json over to the build folder, for other files, the user will need to explicitly set this in the config.
                        if (jsonFilename === PACKAGE_JSON_FILENAME) {
                            await fs.promises.writeFile(path.resolve(monorepoPackage.relativePath, TS_CONFIG_JSON_OUT_DIR, PACKAGE_JSON_FILENAME), outputJsonString);
                        }
                        return right(SUCCESS);
                    })
                );
            }),
            taskEithercoalesceConfigErrors
        ))
    );
}