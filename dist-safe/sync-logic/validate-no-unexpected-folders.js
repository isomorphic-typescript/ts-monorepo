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
const taskEither = require("fp-ts/lib/TaskEither");
const either = require("fp-ts/lib/Either");
const array = require("fp-ts/lib/Array");
const errors_1 = require("../common/errors");
const path = require("path");
const fs = require("fs");
const constants_1 = require("../common/constants");
const pipeable_1 = require("fp-ts/lib/pipeable");
const object_1 = require("../file-system/object");
const presence_assertions_1 = require("../file-system/presence-assertions");
const colorize_special_text_1 = require("../colorize-special-text");
const traverse_package_tree_1 = require("./traverse-package-tree");
const error_coalesce_1 = require("./error-coalesce");
function generateUnexpectedFolderError(relativePath, descriptor) {
    const colorizedRelativePath = descriptor.type === object_1.FileSystemObjectType.file ? colorize_special_text_1.colorize.file(relativePath) :
        descriptor.type === object_1.FileSystemObjectType.directory ? colorize_special_text_1.colorize.directory(relativePath) :
            descriptor.type === object_1.FileSystemObjectType.symlink ? colorize_special_text_1.colorize.symlink(relativePath) : undefined;
    if (colorizedRelativePath === undefined) {
        throw new Error(`Unexpected type ${descriptor.type} for path ${descriptor.path}. Logical program error`);
    }
    // If it's not a directory, there is no valid encoding for this object. If it is a directory, then possibly author forgot to encode for package or junction.
    const isDirectory = descriptor.type === object_1.FileSystemObjectType.directory;
    const encodeForItMessage = isDirectory ? ` or encode for it in ${colorize_special_text_1.colorize.file(constants_1.CONFIG_FILE_NAME)} ` : " ";
    return {
        type: errors_1.ErrorType.UnexpectedFilesystemObject,
        message: `Found unexpected ${descriptor.type} at ${colorizedRelativePath}.${"\n"}Please remove it${encodeForItMessage}before continuing.${isDirectory ? "\nIf a package name segment was renamed, make sure to move over all source code before deleting the directory." : ""}`
    };
}
exports.validateNoUnexpectedFolders = (monorepoConfig) => {
    var _a;
    const packages = (_a = monorepoConfig.packages) !== null && _a !== void 0 ? _a : {};
    const validScopes = Object.keys(packages);
    return pipeable_1.pipe(presence_assertions_1.assertFileSystemObjectType(constants_1.PACKAGES_DIRECTORY_RELATIVE_PATH, [object_1.FileSystemObjectType.nothing, object_1.FileSystemObjectType.directory]), taskEither.chain(descriptor => {
        if (descriptor.type === object_1.FileSystemObjectType.nothing) {
            return taskEither.right([]); // Empty array meaning no children of packages directory
        }
        // Get children of the packages directory.
        return () => __awaiter(void 0, void 0, void 0, function* () { return either.right(yield fs.promises.readdir(path.resolve(constants_1.PACKAGES_DIRECTORY_RELATIVE_PATH))); });
    }), taskEither.chain(packagesDirectoryChildren => pipeable_1.pipe(packagesDirectoryChildren, array.map(packagesDirectoryChild => ({
        possibleScope: packagesDirectoryChild,
        descriptorPromise: object_1.getFileSystemObjectDescriptor(path.resolve(path.join(constants_1.PACKAGES_DIRECTORY_RELATIVE_PATH, packagesDirectoryChild)))
    })), array.map(({ possibleScope, descriptorPromise }) => pipeable_1.pipe(!validScopes.includes(possibleScope) ?
        () => __awaiter(void 0, void 0, void 0, function* () { return either.left([generateUnexpectedFolderError(path.join(constants_1.PACKAGES_DIRECTORY_RELATIVE_PATH, possibleScope), yield descriptorPromise)]); }) :
        taskEither.right(constants_1.SUCCESS), taskEither.chain(() => traverse_package_tree_1.traversePackageTree(packages[possibleScope], traverse_package_tree_1.generateInitialContext(possibleScope), () => taskEither.right(constants_1.SUCCESS), (junctionConfig, context, _childContexts) => () => __awaiter(void 0, void 0, void 0, function* () {
        const validSubfolders = Object.keys(junctionConfig).map(traverse_package_tree_1.nameSegmentToSubFolderName);
        return yield pipeable_1.pipe(yield fs.promises.readdir(path.resolve(context.relativePath)), array.map(junctionSubFolder => () => __awaiter(void 0, void 0, void 0, function* () {
            return !validSubfolders.includes(junctionSubFolder) ?
                either.left([generateUnexpectedFolderError(path.join(context.relativePath, junctionSubFolder), yield object_1.getFileSystemObjectDescriptor(path.resolve(path.join(context.relativePath, junctionSubFolder))))]) :
                either.right(constants_1.SUCCESS);
        })), error_coalesce_1.taskEithercoalesceConfigErrors)();
    }))))), error_coalesce_1.taskEithercoalesceConfigErrors)));
};
//# sourceMappingURL=validate-no-unexpected-folders.js.map