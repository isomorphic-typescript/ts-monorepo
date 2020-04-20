import * as path from 'path';
import { FileSystemObjectType, getFileSystemObjectDescriptor, FileSystemObjectDescriptor } from "./object";
import * as fs from 'fs';
import { ConfigError, ErrorType } from '../common/errors';
import { colorize } from '../colorize-special-text';
import { left, right } from 'fp-ts/lib/Either';
import { Success, SUCCESS } from '../common/constants';
import { TaskEither } from 'fp-ts/lib/TaskEither';

export function assertFileSystemObjectType(pathRelativeToProjectRoot: string, isOneOf: FileSystemObjectType[]): TaskEither<ConfigError[], FileSystemObjectDescriptor> {
    return async () => {
        const descriptor = await getFileSystemObjectDescriptor(path.resolve(pathRelativeToProjectRoot));
        if (!isOneOf.includes(descriptor.type)) {
            return left([{
                type: ErrorType.FileSystemObjectNotFound,
                message: `Expected a ${isOneOf.join(' or ')} at ${colorize.file(pathRelativeToProjectRoot)}. Found ${descriptor.type} instead.`
            }]);
        }
        return right(descriptor);
    };
}

export function assertDirectoryExistsOrCreate(directoryPathRelativeToProjectRoot: string): TaskEither<ConfigError[], Success> {
    return async () => {
        const absolutePath = path.resolve(directoryPathRelativeToProjectRoot);
        const descriptor = await getFileSystemObjectDescriptor(absolutePath);
        if (descriptor.type === FileSystemObjectType.nothing) {
            await fs.promises.mkdir(absolutePath);
        } else if (descriptor.type !== FileSystemObjectType.directory) {
            return left([
                {
                    type: ErrorType.FileSystemObjectNotFound,
                    message: `Expected ${FileSystemObjectType.directory} at ${colorize.directory(directoryPathRelativeToProjectRoot)}. Found ${descriptor.type} instead.`
                }
            ]);
        }
        return right(SUCCESS);
    };
}