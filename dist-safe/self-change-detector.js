"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const presence_assertions_1 = require("./file-system/presence-assertions");
const path = require("path");
const fs = require("fs");
const constants_1 = require("./common/constants");
const object_1 = require("./file-system/object");
const pipeable_1 = require("fp-ts/lib/pipeable");
const taskEither = require("fp-ts/lib/TaskEither");
const either = require("fp-ts/lib/Either");
const errors_1 = require("./common/errors");
const log_1 = require("./logging/log");
const colorize_special_text_1 = require("./colorize-special-text");
let previousFileInfo = undefined;
const PROJECT_IS_NOT_IN_DEV_ENV = [{
        type: errors_1.ErrorType.ToolFileIsNotInDevEnv,
        message: ''
    }];
const CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS = {
    filesAdded: [],
    filesRemoved: [],
    filesChanged: [],
    filesWithSignatureChanges: []
};
function calculateChanges(oldFileInfo, newFileInfo) {
    const changes = [];
    const signatureChanges = [];
    // Keys added
    const added = [];
    const newKeys = Object.keys(newFileInfo);
    newKeys.forEach(newKey => {
        if (oldFileInfo[newKey] === undefined) {
            added.push(newKey);
        }
        else {
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
    const removed = [];
    const oldKeys = Object.keys(oldFileInfo);
    oldKeys.forEach(oldKey => {
        if (newFileInfo[oldKey] === undefined) {
            removed.push(oldKey);
        }
    });
    const actualChangesOccurred = changes.length > 0 || signatureChanges.length > 0 || added.length > 0 || removed.length > 0;
    if (!actualChangesOccurred)
        return undefined;
    return {
        filesAdded: added,
        filesRemoved: removed,
        filesChanged: changes,
        filesWithSignatureChanges: signatureChanges
    };
}
exports.detectProgramChanges = () => __awaiter(void 0, void 0, void 0, function* () {
    // This is some logic to determine if we are in the context of the project being developed, or if we are distributed as a dependency.
    const absolutePathOfTargetRepo = path.resolve('./');
    const absolutePathOfPotentialProject = path.resolve(__filename, '../../');
    const absolutePathOfPotentialProjectPackageJson = path.resolve(absolutePathOfPotentialProject, constants_1.PACKAGE_JSON_FILENAME);
    const absolutePathOfPotentialProjectBuildInfo = path.resolve(absolutePathOfPotentialProject, constants_1.TS_BUILD_INFO_FILENAME);
    const relativePathToPotentialProjectPackageJson = path.relative(absolutePathOfTargetRepo, absolutePathOfPotentialProjectPackageJson);
    const relativePathToPotentialProjectBuildInfo = path.relative(absolutePathOfTargetRepo, absolutePathOfPotentialProjectBuildInfo);
    const STANDARD_ANOMALY_PREFIX = `Did detect change in ${colorize_special_text_1.colorize.file(constants_1.TOOL_SHORT_NAME)}, but`;
    return pipeable_1.pipe(presence_assertions_1.assertFileSystemObjectType(relativePathToPotentialProjectPackageJson, [object_1.FileSystemObjectType.file]), taskEither.chain(projectPackageJsonDescriptor => () => __awaiter(void 0, void 0, void 0, function* () {
        const projectPackageJsonContents = (yield fs.promises.readFile(projectPackageJsonDescriptor.path)).toString();
        let projectPackageJson;
        try {
            projectPackageJson = JSON.parse(projectPackageJsonContents);
        }
        catch (e) {
            log_1.log.warn(`${STANDARD_ANOMALY_PREFIX} was unable to parse json at ${colorize_special_text_1.colorize.file(relativePathToPotentialProjectPackageJson)}.`);
            return either.left(PROJECT_IS_NOT_IN_DEV_ENV);
        }
        if (projectPackageJson.name !== constants_1.TOOL_FULL_NAME)
            return either.left(PROJECT_IS_NOT_IN_DEV_ENV);
        return either.right(constants_1.SUCCESS);
    })), taskEither.chain(() => presence_assertions_1.assertFileSystemObjectType(relativePathToPotentialProjectBuildInfo, [object_1.FileSystemObjectType.file])), taskEither.chain(projectBuildInfoDescriptor => () => __awaiter(void 0, void 0, void 0, function* () {
        const projectBuildInfoJsonContents = (yield fs.promises.readFile(projectBuildInfoDescriptor.path)).toString();
        let projectBuildInfoJson;
        try {
            projectBuildInfoJson = JSON.parse(projectBuildInfoJsonContents);
        }
        catch (e) {
            log_1.log.warn(`${STANDARD_ANOMALY_PREFIX} was unable to parse json at ${colorize_special_text_1.colorize.file(relativePathToPotentialProjectBuildInfo)}`);
            // In this case since the package json is present so we can conclude that we are in a dev env,
            // but when the ts build info is malformed, we should panic (something's very wrong here)
            return either.right(undefined);
        }
        const newFileInfo = projectBuildInfoJson.program.fileInfos;
        const programChanges = previousFileInfo && calculateChanges(previousFileInfo, newFileInfo);
        previousFileInfo = newFileInfo;
        return either.right(programChanges);
    })), taskEither.fold(
    // If any errors happened, we conclude that this could not have been the dev env,
    // so we therefore consider the change event (which provoked this method to be called) is valid.
    // We don't have any information on ts-build info since we aren't in dev env, so we give empty arrays for changes.
    _errors => () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`${constants_1.TOOL_SHORT_NAME} is running as dependency.`);
        // console.log(_errors);
        return CONFIRMED_CHANGE_BUT_WITH_UNKNOWN_SPECIFICS;
    }), programChanged => () => __awaiter(void 0, void 0, void 0, function* () { return programChanged; })))();
});
//# sourceMappingURL=self-change-detector.js.map