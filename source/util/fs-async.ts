import * as fs from 'fs';
import * as util from 'util';

export const fsAsync = {
    createSymlink: util.promisify(fs.symlink),
    deleteDirectory: util.promisify(fs.rmdir),
    deleteFile: util.promisify(fs.unlink),
    exists: util.promisify(fs.exists),
    linkStatistics: util.promisify(fs.lstat),
    linkTarget: util.promisify(fs.realpath),
    makeDirectory: util.promisify(fs.mkdir),
    readDirectory: util.promisify(fs.readdir),
    readFile: util.promisify(fs.readFile),
    statistics: util.promisify(fs.stat),
    writeFile: util.promisify(fs.writeFile),
};

export async function isSymlink(absoluteSourcePath: string) {
    const actualPath = await fsAsync.linkTarget(absoluteSourcePath);
    return actualPath !== absoluteSourcePath;
}