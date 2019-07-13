import { fsAsync } from './fs-async';
import ansicolor = require('ansicolor');
import { log } from './log';
import { comprehensiveDelete } from './recursive-delete-directory';

export enum FileSystemObjectType {
    File = 'file',
    Directory = 'directory'
}

export interface ValidationResult {
    exists: boolean;
    wrong: boolean;
}

async function validateFilesystemObject(absolutePath: string, fileSystemObjectType: FileSystemObjectType, presentationName?: string): Promise<ValidationResult> {
    const displayText = presentationName || absolutePath;
    const coloredDisplayText = fileSystemObjectType === FileSystemObjectType.Directory ?
        ansicolor.cyan(displayText) : ansicolor.green(displayText);
    const oppositeFileSystemObjectType = fileSystemObjectType === FileSystemObjectType.Directory ? FileSystemObjectType.File : FileSystemObjectType.Directory;
    const exists = await fsAsync.exists(absolutePath);
    if (exists) {
        const stats = await fsAsync.statistics(absolutePath);
        if(!stats.isFile() && !stats.isDirectory()) {
            const errrorMessage = `Expected ${fileSystemObjectType} '${coloredDisplayText}', but instead found object that is neigher a file nor directory.`;
            log.error(errrorMessage);
            return {
                exists: true,
                wrong: true
            };
        }
        const isCorrectType = fileSystemObjectType === FileSystemObjectType.Directory ? stats.isDirectory() : stats.isFile();
        if(!isCorrectType) {
            const errorMessage = `Expected ${fileSystemObjectType} '${coloredDisplayText}', but instead found ${oppositeFileSystemObjectType}.`;
            log.error(errorMessage);
            return {
                exists: true,
                wrong: true
            };
        }
        return {
            exists: true,
            wrong: false
        };
    } else {
        const errorMessage = `No such ${fileSystemObjectType} '${coloredDisplayText}' exists`;
        // unlink just in case there is a broken symlink here.
        await comprehensiveDelete(absolutePath);
        log.error(errorMessage);
        return {
            exists: false,
            wrong: true
        };
    }
}

export async function validateFilePresence(absolutePath: string, createWithContentIfNotCorrect?: string, presentationName?: string): Promise<ValidationResult> {
    const validationResult = await validateFilesystemObject(absolutePath, FileSystemObjectType.File, presentationName);
    const correct = !validationResult.wrong && validationResult.exists;
    if (createWithContentIfNotCorrect !== undefined && !correct) {
        if (validationResult.wrong && validationResult.exists) {
            log.warn(`Removing the directory to replace with file...`);
            await comprehensiveDelete(absolutePath);
        }
        await fsAsync.writeFile(absolutePath, createWithContentIfNotCorrect);
        log.info(`Created file '${ansicolor.green(presentationName || absolutePath)}' with contents:\n${createWithContentIfNotCorrect}`);
    }
    return validationResult;

}

export async function validateDirectoryPresence(absolutePath: string, createIfNotCorrect: boolean, presentationName?: string): Promise<ValidationResult> {
    const validationResult = await validateFilesystemObject(absolutePath, FileSystemObjectType.Directory, presentationName);
    const correct = !validationResult.wrong && validationResult.exists;
    if (createIfNotCorrect && !correct) {
        if (validationResult.wrong && validationResult.exists) {
            log.warn(`Removing the file to replace with directory...`);
            await fsAsync.deleteFile(absolutePath);
        }
        await fsAsync.makeDirectory(absolutePath);
        log.info(`Created directory '${ansicolor.cyan(presentationName || absolutePath)}'.`);
    }
    return validationResult;
}

export async function validateSymlinkPresence(absoluteSourcePath: string, absoluteDestinationPath: string, file: boolean, presentationNameSource: string, presentationNameDestination: string) {
    const exists = await fsAsync.exists(absoluteDestinationPath);
    if (!exists) {
        throw new Error(`When trying to create symlink '${ansicolor.blue(presentationNameSource)}', found that the intended destination ${
            file ? "file '" + ansicolor.green(presentationNameDestination) : "directory '" + ansicolor.cyan(presentationNameDestination)
        }' does not exist.`);
    }

    const destinationStatistics = await fsAsync.statistics(absoluteDestinationPath);
    if (destinationStatistics.isFile() !== file) {
        throw new Error(`When trying to create symlink '${ansicolor.blue(presentationNameSource)}', found that the intended destination '${
            file ? "file " + ansicolor.green(presentationNameDestination) + " is actually a directory"
            :
            "directory " + ansicolor.cyan(presentationNameDestination) + " is actually a file"
        }`);
    }

    const actualDestination = await fsAsync.linkTarget(absoluteSourcePath);
    if (actualDestination !== absoluteDestinationPath) {
        log.info(`Creating symlink from ${ansicolor.blue(presentationNameSource)} to ${file ? ansicolor.green(presentationNameDestination) : ansicolor.cyan(presentationNameDestination)}`);
        if (actualDestination === absoluteSourcePath) {
            const sourceStatistics = await fsAsync.statistics(absoluteSourcePath);
            const isFile = sourceStatistics.isFile();
            log.info(`There is already a ${isFile ? "file" : "directory"} at the site of desired simlink. Removing it...`);
            if (sourceStatistics.isFile()) {
                await fsAsync.deleteFile(absoluteSourcePath);
            } else {
                await comprehensiveDelete(absoluteSourcePath);
            }
        }
        await fsAsync.createSymlink(absoluteDestinationPath, absoluteSourcePath, file ? "file" : "dir");
    }
}