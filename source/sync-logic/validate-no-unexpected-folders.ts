import * as t from 'io-ts';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as either from 'fp-ts/lib/Either';
import * as array from 'fp-ts/lib/Array';
import { ConfigError, ErrorType } from '../common/errors';
import * as path from 'path';
import * as fs from 'fs';
import { Success, PACKAGES_DIRECTORY_RELATIVE_PATH, SUCCESS, CONFIG_FILE_NAME } from '../common/constants';
import { pipe } from 'fp-ts/lib/pipeable';
import { FileSystemObjectType, getFileSystemObjectDescriptor, FileSystemObjectDescriptor } from '../file-system/object';
import { assertFileSystemObjectType } from '../file-system/presence-assertions';
import { TSMonorepoJson } from '../common/types/io-ts/config-types';
import { colorize } from '../colorize-special-text';
import { traversePackageTree, generateInitialContext, nameSegmentToSubFolderName } from './traverse-package-tree';
import { taskEithercoalesceConfigErrors } from './error-coalesce';

function generateUnexpectedFolderError(relativePath: string, descriptor: FileSystemObjectDescriptor): ConfigError {
    const colorizedRelativePath = 
        descriptor.type === FileSystemObjectType.file ? colorize.file(relativePath) :
        descriptor.type === FileSystemObjectType.directory ? colorize.directory(relativePath) :
        descriptor.type === FileSystemObjectType.symlink ? colorize.symlink(relativePath) : undefined;
    if (colorizedRelativePath === undefined) {
        throw new Error(`Unexpected type ${descriptor.type} for path ${descriptor.path}. Logical program error`);
    }
    // If it's not a directory, there is no valid encoding for this object. If it is a directory, then possibly author forgot to encode for package or junction.
    const isDirectory = descriptor.type === FileSystemObjectType.directory;
    const encodeForItMessage = isDirectory ? ` or encode for it in ${colorize.file(CONFIG_FILE_NAME)} ` : " ";
    return {
        type: ErrorType.UnexpectedFilesystemObject,
        message: `Found unexpected ${descriptor.type} at ${colorizedRelativePath}.${
            "\n"}Please remove it${encodeForItMessage}before continuing.${
            isDirectory ? "\nIf a package name segment was renamed, make sure to move over all source code before deleting the directory." : ""}`
    };
}

export const validateNoUnexpectedFolders = (monorepoConfig: t.TypeOf<typeof TSMonorepoJson>): taskEither.TaskEither<ConfigError[], Success> => {
    const packages = monorepoConfig.packages ?? {};
    const validScopes = Object.keys(packages);
    return pipe(
        assertFileSystemObjectType(PACKAGES_DIRECTORY_RELATIVE_PATH, [FileSystemObjectType.nothing, FileSystemObjectType.directory]),
        taskEither.chain(descriptor => {
            if (descriptor.type === FileSystemObjectType.nothing) {
                return taskEither.right([]); // Empty array meaning no children of packages directory
            }
            // Get children of the packages directory.
            return async () => either.right(await fs.promises.readdir(path.resolve(PACKAGES_DIRECTORY_RELATIVE_PATH)));
        }),
        taskEither.chain(packagesDirectoryChildren => pipe(
            packagesDirectoryChildren,
            array.map(packagesDirectoryChild => ({
                possibleScope: packagesDirectoryChild,
                descriptorPromise: getFileSystemObjectDescriptor(path.resolve(path.join(PACKAGES_DIRECTORY_RELATIVE_PATH, packagesDirectoryChild)))
            })),
            array.map(({possibleScope, descriptorPromise}) => pipe(
                !validScopes.includes(possibleScope) ? 
                    async () => either.left([generateUnexpectedFolderError(path.join(PACKAGES_DIRECTORY_RELATIVE_PATH, possibleScope), await descriptorPromise)]) :
                    taskEither.right<ConfigError[], Success>(SUCCESS),
                taskEither.chain(() => traversePackageTree(
                    packages[possibleScope],
                    generateInitialContext(possibleScope),
                    () => taskEither.right(SUCCESS),
                    (junctionConfig, context, _childContexts) => async () => {
                        const validSubfolders = Object.keys(junctionConfig).map(nameSegmentToSubFolderName);
                        return await pipe(
                            await fs.promises.readdir(path.resolve(context.relativePath)),
                            array.map(junctionSubFolder => async() =>
                                !validSubfolders.includes(junctionSubFolder) ?
                                    either.left([generateUnexpectedFolderError(
                                        path.join(context.relativePath, junctionSubFolder),
                                        await getFileSystemObjectDescriptor(path.resolve(path.join(context.relativePath, junctionSubFolder)))
                                    )]) :
                                    either.right(SUCCESS)
                            ),
                            taskEithercoalesceConfigErrors
                        )();
                    }
                ))
            )),
            taskEithercoalesceConfigErrors
        ))
    );
}