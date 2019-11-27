import * as path from 'path';
import { FileSystemObjectType, getFileSystemObjectDescriptor } from "./object";
import * as fs from 'fs';
import { ConfigError, ErrorType } from '../error';
import { colorize } from '../colorize-special-text';

export async function assertFileExists(filePathRelativeToProjectRoot: string): Promise<ConfigError[]> {
    const descriptor = await getFileSystemObjectDescriptor(path.resolve(filePathRelativeToProjectRoot));
    if (descriptor.type !== FileSystemObjectType.file) {
        return [
            {
                type: ErrorType.FileSystemObjectNotFound,
                message: `Expected ${FileSystemObjectType.file} at ${colorize.file(filePathRelativeToProjectRoot)}. Found ${descriptor.type} instead.`
            }
        ];
    }
    return [];
}

export async function assertDirectoryExistsOrCreate(directoryPathRelativeToProjectRoot: string): Promise<ConfigError[]> {
    const absolutePath = path.resolve(directoryPathRelativeToProjectRoot);
    const descriptor = await getFileSystemObjectDescriptor(absolutePath);
    if (descriptor.type === FileSystemObjectType.nothing) {
        await fs.promises.mkdir(absolutePath);
    } else if (descriptor.type !== FileSystemObjectType.directory) {
        return [
            {
                type: ErrorType.FileSystemObjectNotFound,
                message: `Expected ${FileSystemObjectType.directory} at ${colorize.directory(directoryPathRelativeToProjectRoot)}. Found ${descriptor.type} instead.`
            }
        ];
    }
    return [];
}