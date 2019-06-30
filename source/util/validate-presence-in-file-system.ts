import { fsAsync } from './fs-async';
import ansicolor = require('ansicolor');
import { log } from './log';
import { recursivelyDeleteDirectoryAsync } from './recursive-delete-directory';

export enum FileSystemObjectType {
    File = 'file',
    Directory = 'directory'
}

export interface ValidationResult {
    exists: boolean;
    wrong: boolean;
}

async function validateFilesystemObject(absolutePath: string, throwErrorIfMissing: boolean, throwErrorIfWrong: boolean, fileSystemObjectType: FileSystemObjectType, presentationName?: string): Promise<ValidationResult> {
    const displayText = presentationName || absolutePath;
    const coloredDisplayText = fileSystemObjectType === FileSystemObjectType.Directory ?
        ansicolor.cyan(displayText) : ansicolor.green(displayText);
    const oppositeFileSystemObjectType = fileSystemObjectType === FileSystemObjectType.Directory ? FileSystemObjectType.File : FileSystemObjectType.Directory;
    const exists = await fsAsync.exists(absolutePath);
    if (exists) {
        const stats = await fsAsync.statistics(absolutePath);
        if(!stats.isFile() && !stats.isDirectory()) {
            const errrorMessage = `Expected ${fileSystemObjectType} '${coloredDisplayText}', but instead found object that is neigher a file nor directory.`;
            if (throwErrorIfWrong) {
                throw new Error(errrorMessage);
            } else {
                log.error(errrorMessage);
            }
            return {
                exists: true,
                wrong: true
            };
        }
        const isCorrectType = fileSystemObjectType === FileSystemObjectType.Directory ? stats.isDirectory() : stats.isFile();
        if(!isCorrectType) {
            const errorMessage = `Expected ${fileSystemObjectType} '${coloredDisplayText}', but instead found ${oppositeFileSystemObjectType}.`;
            if (throwErrorIfWrong) {
                throw new Error(errorMessage);
            } else {
                log.error(errorMessage);
            }
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
        if (throwErrorIfMissing) {
            throw new Error(errorMessage);
        } else {
            log.error(errorMessage);
        }
        return {
            exists: false,
            wrong: true
        };
    }
}

export async function validateFilePresence(absolutePath: string, throwIfMissing: boolean, throwIfWrong: boolean, createWithContentIfNotCorrect?: string, presentationName?: string): Promise<ValidationResult> {
    const validationResult = await validateFilesystemObject(absolutePath, throwIfMissing, throwIfWrong, FileSystemObjectType.File, presentationName);
    const correct = !validationResult.wrong && validationResult.exists;
    if (createWithContentIfNotCorrect !== undefined && !correct) {
        if (validationResult.wrong && validationResult.exists) {
            log.warn(`Removing the directory to replace with file...`);
            await recursivelyDeleteDirectoryAsync(absolutePath);
        }
        await fsAsync.writeFile(absolutePath, createWithContentIfNotCorrect);
        log.info(`Created file '${ansicolor.green(presentationName || absolutePath)}' with contents:\n${createWithContentIfNotCorrect}`);
    }
    return validationResult;

}

export async function validateDirectoryPresence(absolutePath: string, throwIfMissing: boolean, throwIfWrong: boolean, createIfNotCorrect: boolean, presentationName?: string): Promise<ValidationResult> {
    const validationResult = await validateFilesystemObject(absolutePath, throwIfMissing, throwIfWrong, FileSystemObjectType.Directory, presentationName);
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