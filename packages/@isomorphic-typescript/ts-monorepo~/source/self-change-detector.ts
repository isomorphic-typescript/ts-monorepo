import { assertFileSystemObjectType } from "./file-system/presence-assertions";
import * as path from 'path';
import * as fs from 'fs';
import { PACKAGE_JSON_FILENAME, TS_BUILD_INFO_FILENAME, SUCCESS, TOOL_FULL_NAME, Success, TOOL_SHORT_NAME } from "./common/constants";
import { FileSystemObjectType } from "./file-system/object";
import { pipe } from 'fp-ts/lib/pipeable';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as either from 'fp-ts/lib/Either';
import { ConfigError, ErrorType } from "./common/errors";
import { log } from "./logging/log";
import { colorize } from "./colorize-special-text";

let previousFileInfo: FileInfo | undefined = undefined;

const PROJECT_IS_NOT_IN_DEV_ENV: ConfigError[] = [{
    type: ErrorType.ToolFileIsNotInDevEnv,
    message: ''
}];

interface FileInfo {
    [filename: string]: {
        version: string;
        signature: string;
    }
}

interface ProgramChanges {
    filesAdded: string[];
    filesRemoved: string[];
    filesChanged: string[];
    filesWithSignatureChanges: string[];
}

const CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS: ProgramChanges = {
    filesAdded: [],
    filesRemoved: [],
    filesChanged: [],
    filesWithSignatureChanges: []
};

function calculateChanges(oldFileInfo: FileInfo, newFileInfo: FileInfo): ProgramChanges | undefined {
    const changes: string[] = [];
    const signatureChanges: string[] = [];

    // Keys added
    const added: string[] = [];
    const newKeys = Object.keys(newFileInfo);
    newKeys.forEach(newKey => {
        if (oldFileInfo[newKey] === undefined) {
            added.push(newKey);
        } else {
            const oldFile = oldFileInfo[newKey];
            const newFile = newFileInfo[newKey];
            // Keys where version changed
            if (oldFile.version !== newFile.version) {
                changes.push(newKey);
            }
            // Keys where signature changed.
            if (oldFile.signature !== newFile.signature) {
                signatureChanges.push(newKey);
            }
        }
    });

    // Keys deleted
    const removed: string[] = [];
    const oldKeys = Object.keys(oldFileInfo);
    oldKeys.forEach(oldKey => {
        if (newFileInfo[oldKey] === undefined) {
            removed.push(oldKey);
        }
    });

    const actualChangesOccurred = changes.length > 0 || signatureChanges.length > 0 || added.length > 0 || removed.length > 0;
    if (!actualChangesOccurred) return undefined;
    return {
        filesAdded: added,
        filesRemoved: removed,
        filesChanged: changes,
        filesWithSignatureChanges: signatureChanges
    };
}

export const detectProgramChanges = async (): Promise<ProgramChanges | undefined> => {
    // This is some logic to determine if we are in the context of the project being developed, or if we are distributed as a dependency.
    const absolutePathOfTargetRepo = path.resolve('./');
    const absolutePathOfPotentialProject = path.resolve(__filename, '../../');
    const absolutePathOfPotentialProjectPackageJson = path.resolve(absolutePathOfPotentialProject, PACKAGE_JSON_FILENAME);
    const absolutePathOfPotentialProjectBuildInfo = path.resolve(absolutePathOfPotentialProject, TS_BUILD_INFO_FILENAME);

    const relativePathToPotentialProjectPackageJson = path.relative(absolutePathOfTargetRepo, absolutePathOfPotentialProjectPackageJson);
    const relativePathToPotentialProjectBuildInfo = path.relative(absolutePathOfTargetRepo, absolutePathOfPotentialProjectBuildInfo);

    const STANDARD_ANOMALY_PREFIX = `Did detect change in ${colorize.file(TOOL_SHORT_NAME)}, but`;

    return pipe(
        assertFileSystemObjectType(relativePathToPotentialProjectPackageJson, [FileSystemObjectType.file]),
        taskEither.chain(projectPackageJsonDescriptor => async (): Promise<either.Either<ConfigError[], Success>> => {
            const projectPackageJsonContents = (await fs.promises.readFile(projectPackageJsonDescriptor.path)).toString();
            let projectPackageJson;
            try {
                projectPackageJson = JSON.parse(projectPackageJsonContents);
            } catch(e) {
                log.warn(`${STANDARD_ANOMALY_PREFIX} was unable to parse json at ${colorize.file(relativePathToPotentialProjectPackageJson)}.`);
                return either.left(PROJECT_IS_NOT_IN_DEV_ENV);
            }
            if (projectPackageJson.name !== TOOL_FULL_NAME) return either.left(PROJECT_IS_NOT_IN_DEV_ENV);
            return either.right(SUCCESS);
        }),
        taskEither.chain(() => assertFileSystemObjectType(relativePathToPotentialProjectBuildInfo, [FileSystemObjectType.file])),
        taskEither.chain(projectBuildInfoDescriptor => async (): Promise<either.Either<ConfigError[], ProgramChanges | undefined>> => {
            const projectBuildInfoJsonContents = (await fs.promises.readFile(projectBuildInfoDescriptor.path)).toString();
            let projectBuildInfoJson;
            try {
                projectBuildInfoJson = JSON.parse(projectBuildInfoJsonContents);
            } catch(e) {
                log.warn(`${STANDARD_ANOMALY_PREFIX} was unable to parse json at ${colorize.file(relativePathToPotentialProjectBuildInfo)}`);
                // In this case since the package json is present so we can conclude that we are in a dev env,
                // but when the ts build info is malformed, we should panic (something's very wrong here)
                return either.right(undefined);
            }

            const newFileInfo: FileInfo = projectBuildInfoJson.program.fileInfos;
            const programChanges: ProgramChanges | undefined = previousFileInfo && calculateChanges(previousFileInfo, newFileInfo);
            previousFileInfo = newFileInfo;

            return either.right(programChanges);
        }),
        taskEither.fold(
            // If any errors happened, we conclude that this could not have been the dev env,
            // so we therefore consider the change event (which provoked this method to be called) is valid.
            // We don't have any information on ts-build info since we aren't in dev env, so we give empty arrays for changes.
            _errors => async () => {
                console.log(`${TOOL_SHORT_NAME} is running as dependency.`);
                // console.log(_errors);
                return CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS
            },

            programChanged => async () => programChanged
        )
    )();
}