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
import { md5Hash } from "./common/util";
import * as Option from 'fp-ts/lib/Option';

// This is some logic to determine if we are in the context of the project being developed, or if we are distributed as a dependency.
const absolutePathOfTargetRepo = path.resolve('./');
const absolutePathOfPotentialProject = path.resolve(__filename, '../../');
const absolutePathOfPotentialProjectPackageJson = path.resolve(absolutePathOfPotentialProject, PACKAGE_JSON_FILENAME);
const absolutePathOfPotentialProjectBuildInfo = path.resolve(absolutePathOfPotentialProject, TS_BUILD_INFO_FILENAME);

const relativePathToPotentialProjectPackageJson = path.relative(absolutePathOfTargetRepo, absolutePathOfPotentialProjectPackageJson);
const relativePathToPotentialProjectBuildInfo = path.relative(absolutePathOfTargetRepo, absolutePathOfPotentialProjectBuildInfo);

const PROJECT_IS_NOT_IN_DEV_ENV: ConfigError[] = [{
    type: ErrorType.ToolFileIsNotInDevEnv,
    message: ''
}];

const STANDARD_ANOMALY_PREFIX = `Did detect change in ${colorize.file(TOOL_SHORT_NAME)}, but`;

interface FileInfo {
    [filename: string]: {
        version: string;
        signature: string;
    }
}

function getFileInfo() {
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
        taskEither.chain(projectBuildInfoDescriptor => async (): Promise<either.Either<ConfigError[], Option.Option<FileInfo>>> => {
            const projectBuildInfoJsonContents = (await fs.promises.readFile(projectBuildInfoDescriptor.path)).toString();
            let projectBuildInfoJson;
            try {
                projectBuildInfoJson = JSON.parse(projectBuildInfoJsonContents);
            } catch(e) {
                log.warn(`${STANDARD_ANOMALY_PREFIX} was unable to parse json at ${colorize.file(relativePathToPotentialProjectBuildInfo)}`);
                // In this case since the package json is present so we can conclude that we are in a dev env,
                // but when the ts build info is malformed, we should panic (something's very wrong here)
                return either.right(Option.none);
            }
            const fileInfos: FileInfo = projectBuildInfoJson.program.fileInfos;
            return either.right(Option.some(fileInfos));
        })
    )
}

const currentFileInfoPromise: Promise<Option.Option<FileInfo>> = pipe(
    getFileInfo(),
    taskEither.fold(
        _errors => async () => Option.none,
        maybeFileInfo => async () => maybeFileInfo
    )
)();

export async function initialize() {
    const maybeFileInfo = await currentFileInfoPromise;
    if (Option.isSome(maybeFileInfo)) {
        log.info(`rapid development mode enabled`);
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

function calculateChanges(oldFileInfo: FileInfo, newFileInfo: FileInfo): Option.Option<ProgramChanges> {
    const changes: string[] = [];
    const signatureChanges: string[] = [];

    log.trace(`Rapid dev change detection: old ${colorize.package(TOOL_SHORT_NAME)} tool hash: ${md5Hash(JSON.stringify(oldFileInfo))}`);
    log.trace(`Rapid dev change detection: new ${colorize.package(TOOL_SHORT_NAME)} tool hash: ${md5Hash(JSON.stringify(newFileInfo))}`);

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
    if (!actualChangesOccurred) return Option.none;
    return Option.some({
        filesAdded: added,
        filesRemoved: removed,
        filesChanged: changes,
        filesWithSignatureChanges: signatureChanges
    });
}

// TODO: we should also compare the package.json from before and after
export const detectProgramChanges = async (): Promise<Option.Option<ProgramChanges>> => {
    const currentFileInfo = await currentFileInfoPromise;

    if (Option.isNone(currentFileInfo)) {
        log.warn("No original build info file loaded. Assuming that change occurred");
        return Option.some(CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS);
    }

    return pipe(
        getFileInfo(),
        taskEither.chain(newFileInfo => async (): Promise<either.Either<ConfigError[], Option.Option<ProgramChanges>>> => {
            if (Option.isNone(newFileInfo)) {
                log.warn("No new build info file loaded. Assuming that change occurred");
                return either.right(Option.some(CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS));
            }
            return either.right(calculateChanges(currentFileInfo.value, newFileInfo.value));
        }),
        taskEither.fold(
            // If any errors happened, we conclude that this could not have been the dev env,
            // so we therefore consider the change event (which provoked this method to be called) is valid.
            // We don't have any information on ts-build info since we aren't in dev env, so we give empty arrays for changes.
            _errors => async () => {
                return Option.some(CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS)
            },

            maybeProgramChanges => async () => maybeProgramChanges
        )
    )();
}