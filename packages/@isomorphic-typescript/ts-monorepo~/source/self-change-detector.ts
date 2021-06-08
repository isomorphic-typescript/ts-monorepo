import { assertFileSystemObjectType } from "./file-system/presence-assertions";
import * as path from 'path';
import * as fs from 'fs';
import { PACKAGE_JSON_FILENAME, TS_BUILD_INFO_FILENAME, SUCCESS, TOOL_FULL_NAME, Success, TOOL_SHORT_NAME } from "./common/constants";
import { FileSystemObjectType } from "./file-system/object";
import { pipe } from 'fp-ts/lib/function';
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

interface BuildInfo {
    fileNames: string[];
    fileInfos: {
        version: string;
        signature: string;
    }[];
}

function getBuildInfo() {
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
        taskEither.chain(projectBuildInfoDescriptor => async (): Promise<either.Either<ConfigError[], Option.Option<BuildInfo>>> => {
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
            const buildinfoProgram: BuildInfo = projectBuildInfoJson.program;
            return either.right(Option.some(buildinfoProgram));
        })
    )
}

const currentBuildInfoPromise: Promise<Option.Option<BuildInfo>> = pipe(
    getBuildInfo(),
    taskEither.fold(
        _errors => async () => Option.none,
        maybeFileInfo => async () => maybeFileInfo
    )
)();

export async function initialize() {
    const maybeBuildInfo = await currentBuildInfoPromise;
    if (Option.isSome(maybeBuildInfo)) {
        log.info(`${colorize.subfeature("build:rapid")} mode enabled`);
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

function calculateChanges(oldBuildInfo: BuildInfo, newBuildInfo: BuildInfo): Option.Option<ProgramChanges> {
    const changes: string[] = [];
    const signatureChanges: string[] = [];

    const oldHash = md5Hash(JSON.stringify(oldBuildInfo));
    const newHash = md5Hash(JSON.stringify(newBuildInfo));
    if (oldHash === newHash) {
        log.trace(`${colorize.subfeature("build:rapid")} mode: current ${colorize.package(TOOL_SHORT_NAME)} tool hash is ${oldHash}`);
    } else {
        log.trace(`${colorize.subfeature("build:rapid")} mode: change detected; old ${colorize.package(TOOL_SHORT_NAME)} tool hash is ${oldHash}`);
        log.trace(`${colorize.subfeature("build:rapid")} mode: change detected; new ${colorize.package(TOOL_SHORT_NAME)} tool hash is ${newHash}`);
    }

    // files added
    const added: string[] = [];
    newBuildInfo.fileInfos.forEach((_fileInfo, idx) => {
        if (oldBuildInfo.fileInfos[idx] === undefined) {
            added.push(newBuildInfo.fileNames[idx]);
        } else {
            const oldFile = oldBuildInfo.fileInfos[idx];
            const newFile = newBuildInfo.fileInfos[idx];
            // Keys where version changed
            if (oldFile.version !== newFile.version) {
                changes.push(newBuildInfo.fileNames[idx]);
            }
            // Keys where signature changed.
            if (oldFile.signature !== newFile.signature) {
                signatureChanges.push(newBuildInfo.fileNames[idx]);
            }
        }
    })

    // files deleted
    const removed: string[] = [];
    oldBuildInfo.fileInfos.forEach((_fileInfo, idx) => {
        if (newBuildInfo.fileInfos[idx] === undefined) {
            removed.push(oldBuildInfo.fileNames[idx]);
        }
    })

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
    const currentBuildInfo = await currentBuildInfoPromise;

    if (Option.isNone(currentBuildInfo)) {
        log.warn("No original build info file loaded. Assuming that change occurred");
        return Option.some(CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS);
    }

    return pipe(
        getBuildInfo(),
        taskEither.chain(newBuildInfo => async (): Promise<either.Either<ConfigError[], Option.Option<ProgramChanges>>> => {
            if (Option.isNone(newBuildInfo)) {
                log.warn("No new build info file loaded. Assuming that change occurred");
                return either.right(Option.some(CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS));
            }
            return either.right(calculateChanges(currentBuildInfo.value, newBuildInfo.value));
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