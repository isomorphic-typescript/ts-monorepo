import * as fs from 'fs';
import * as util from 'util';

export const fsAsync = {
    deleteDirectory: util.promisify(fs.rmdir),
    deleteFile: util.promisify(fs.unlink),
    exists: util.promisify(fs.exists),
    makeDirectory: util.promisify(fs.mkdir),
    readDirectory: util.promisify(fs.readdir),
    readFile: util.promisify(fs.readFile),
    statistics: util.promisify(fs.stat),
    writeFile: util.promisify(fs.writeFile),
};